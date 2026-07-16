-- =========================================================
-- XP awarding — one shared helper, called from per-table triggers below.
-- =========================================================

create or replace function public.award_xp(p_user_id uuid, p_event_type xp_event_type, p_amount integer, p_reference_id uuid default null)
returns void language plpgsql security definer as $$
begin
  insert into public.xp_events (user_id, event_type, amount, reference_id) values (p_user_id, p_event_type, p_amount, p_reference_id);
  update public.profiles set xp = xp + p_amount where id = p_user_id;
end;
$$;

-- =========================================================
-- Badge checking — recomputes all 8 conditions for one user and awards
-- any newly-earned badges (idempotent via ON CONFLICT DO NOTHING). Not
-- used on the `visits` path (see on_visit_xp below) since that table is
-- far higher-volume than the others and only one badge depends on it —
-- running four aggregate joins on every single profile view would be a
-- real performance cost for no benefit.
-- =========================================================

create or replace function public.check_and_award_badges(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_message_count integer;
  v_visitor_count integer;
  v_reactions_received integer;
  v_comments_received integer;
  v_comments_posted integer;
  v_max_reposts_on_one_message integer;
  v_follower_count integer;
begin
  select message_count, visitor_count into v_message_count, v_visitor_count
    from public.profiles where id = p_user_id;

  select count(*) into v_reactions_received
    from public.message_reactions mr join public.messages m on m.id = mr.message_id
    where m.recipient_id = p_user_id;

  select count(*) into v_comments_received
    from public.comments c join public.messages m on m.id = c.message_id
    where m.recipient_id = p_user_id and c.is_deleted = false;

  select count(*) into v_comments_posted
    from public.comments where author_id = p_user_id and is_deleted = false;

  select coalesce(max(repost_count), 0) into v_max_reposts_on_one_message
    from (
      select count(*) as repost_count from public.reposts r
      join public.messages m on m.id = r.original_message_id
      where m.recipient_id = p_user_id
      group by r.original_message_id
    ) counts;

  select count(*) into v_follower_count from public.follows where following_id = p_user_id;

  if v_message_count >= 1 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'first_message'
      on conflict do nothing;
  end if;

  if v_reactions_received >= 100 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'hundred_reactions'
      on conflict do nothing;
  end if;

  if v_reactions_received >= 500 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'popular_author'
      on conflict do nothing;
  end if;

  if v_comments_received >= 100 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'hundred_comments'
      on conflict do nothing;
  end if;

  if v_comments_posted >= 50 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'top_contributor'
      on conflict do nothing;
  end if;

  if v_max_reposts_on_one_message >= 20 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'trend_creator'
      on conflict do nothing;
  end if;

  if v_follower_count >= 100 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'hundred_followers'
      on conflict do nothing;
  end if;

  if v_visitor_count >= 1000 then
    insert into public.user_badges (user_id, badge_id)
      select p_user_id, id from public.badges where code = 'thousand_views'
      on conflict do nothing;
  end if;
end;
$$;

-- =========================================================
-- Per-table triggers
-- =========================================================

-- Posting (sending an anonymous message) — XP to the sender, only if
-- they were logged in. Also runs a badge check for the recipient (covers
-- "first_message").
create or replace function public.on_message_sent_xp()
returns trigger language plpgsql security definer as $$
begin
  if new.sender_user_id is not null then
    perform public.award_xp(new.sender_user_id, 'message_sent', 10, new.id);
  end if;
  perform public.check_and_award_badges(new.recipient_id);
  return new;
end;
$$;

create trigger trg_message_sent_xp
  after insert on public.messages
  for each row execute function public.on_message_sent_xp();

-- Replying — XP to the replying owner.
create or replace function public.on_reply_xp()
returns trigger language plpgsql security definer as $$
begin
  perform public.award_xp(new.author_id, 'reply_posted', 5, new.id);
  return new;
end;
$$;

create trigger trg_reply_xp
  after insert on public.replies
  for each row execute function public.on_reply_xp();

-- Commenting — XP to the commenter; badge check for both the commenter
-- (top_contributor) and the message's recipient (hundred_comments).
create or replace function public.on_comment_xp()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  perform public.award_xp(new.author_id, 'comment_posted', 3, new.id);
  select recipient_id into v_recipient_id from public.messages where id = new.message_id;
  if v_recipient_id is not null then
    perform public.check_and_award_badges(v_recipient_id);
  end if;
  perform public.check_and_award_badges(new.author_id);
  return new;
end;
$$;

create trigger trg_comment_xp
  after insert on public.comments
  for each row execute function public.on_comment_xp();

-- Reaction received — XP to the message recipient.
create or replace function public.on_reaction_xp()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  select recipient_id into v_recipient_id from public.messages where id = new.message_id;
  if v_recipient_id is not null then
    perform public.award_xp(v_recipient_id, 'reaction_received', 2, new.message_id);
    perform public.check_and_award_badges(v_recipient_id);
  end if;
  return new;
end;
$$;

create trigger trg_reaction_xp
  after insert on public.message_reactions
  for each row execute function public.on_reaction_xp();

-- Repost received — XP to the original message's recipient.
create or replace function public.on_repost_xp()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  select recipient_id into v_recipient_id from public.messages where id = new.original_message_id;
  if v_recipient_id is not null then
    perform public.award_xp(v_recipient_id, 'repost_received', 8, new.original_message_id);
    perform public.check_and_award_badges(v_recipient_id);
  end if;
  return new;
end;
$$;

create trigger trg_repost_xp
  after insert on public.reposts
  for each row execute function public.on_repost_xp();

-- Follower gained — XP to the followed user.
create or replace function public.on_follow_xp()
returns trigger language plpgsql security definer as $$
begin
  perform public.award_xp(new.following_id, 'follower_gained', 15, new.id);
  perform public.check_and_award_badges(new.following_id);
  return new;
end;
$$;

create trigger trg_follow_xp
  after insert on public.follows
  for each row execute function public.on_follow_xp();

-- Profile visited — small XP; deliberately lightweight badge check (see
-- comment on check_and_award_badges above) since this is by far the
-- highest-volume trigger of the set.
create or replace function public.on_visit_xp()
returns trigger language plpgsql security definer as $$
declare
  v_visitor_count integer;
begin
  perform public.award_xp(new.profile_id, 'profile_visited', 1, new.id);
  select visitor_count into v_visitor_count from public.profiles where id = new.profile_id;
  if v_visitor_count >= 1000 then
    insert into public.user_badges (user_id, badge_id)
      select new.profile_id, id from public.badges where code = 'thousand_views'
      on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger trg_visit_xp
  after insert on public.visits
  for each row execute function public.on_visit_xp();

-- =========================================================
-- Tags — called from sendMessageAction after the message insert succeeds.
-- SECURITY DEFINER since anon/authenticated have no direct INSERT policy
-- on tags/message_tags (see 0017_tags.sql).
-- =========================================================

create or replace function public.attach_tags_to_message(p_message_id uuid, p_tag_names text[])
returns void language plpgsql security definer as $$
declare
  v_tag_name text;
  v_slug text;
  v_tag_id uuid;
  v_count integer := 0;
  v_rows_affected integer;
begin
  if p_tag_names is null or array_length(p_tag_names, 1) is null then
    return;
  end if;

  foreach v_tag_name in array p_tag_names loop
    exit when v_count >= 3; -- max 3 DISTINCT tags per message

    v_tag_name := trim(lower(v_tag_name));
    continue when v_tag_name = '' or char_length(v_tag_name) > 30;

    v_slug := regexp_replace(v_tag_name, '[^a-z0-9\u0600-\u06FF]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    continue when v_slug = '';

    insert into public.tags (name, slug) values (v_tag_name, v_slug)
      on conflict (slug) do update set name = excluded.name
      returning id into v_tag_id;

    insert into public.message_tags (message_id, tag_id) values (p_message_id, v_tag_id)
      on conflict do nothing;
    get diagnostics v_rows_affected = row_count;

    -- Only count towards the 3-tag cap and bump usage_count when this
    -- was a genuinely new attachment — a repeated/duplicate tag name in
    -- the same submission must not consume a "slot" or inflate the count.
    if v_rows_affected > 0 then
      update public.tags set usage_count = usage_count + 1 where id = v_tag_id;
      v_count := v_count + 1;
    end if;
  end loop;
end;
$$;

grant execute on function public.attach_tags_to_message(uuid, text[]) to anon, authenticated;

-- =========================================================
-- Random message ("Surprise Me") — read-only, no elevated privileges
-- needed since it only surfaces already-public published messages.
-- =========================================================

create or replace function public.get_random_message(p_category message_category default null)
returns uuid language sql stable as $$
  select id from public.messages
  where is_published = true and is_deleted = false
    and (p_category is null or category = p_category)
  order by random()
  limit 1;
$$;

grant execute on function public.get_random_message(message_category) to anon, authenticated;

-- =========================================================
-- Confession of the Day — idempotent per-day selection, race-safe.
-- =========================================================

create or replace function public.get_or_create_daily_feature()
returns uuid language plpgsql security definer as $$
declare
  v_message_id uuid;
begin
  select message_id into v_message_id from public.featured_messages where featured_date = current_date;
  if v_message_id is not null then
    return v_message_id;
  end if;

  select m.id into v_message_id
  from public.messages m
  left join public.message_reactions mr on mr.message_id = m.id
  where m.is_published = true and m.is_deleted = false
    and m.published_at >= now() - interval '3 days'
    and not exists (select 1 from public.featured_messages fm where fm.message_id = m.id)
  group by m.id
  order by count(mr.id) desc, m.published_at desc
  limit 1;

  if v_message_id is null then
    return null;
  end if;

  insert into public.featured_messages (message_id, featured_date)
    values (v_message_id, current_date)
    on conflict (featured_date) do nothing
    returning message_id into v_message_id;

  if v_message_id is null then
    -- A concurrent request won the race and inserted today's feature first.
    select message_id into v_message_id from public.featured_messages where featured_date = current_date;
  end if;

  return v_message_id;
end;
$$;

grant execute on function public.get_or_create_daily_feature() to anon, authenticated;
