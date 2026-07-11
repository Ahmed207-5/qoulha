create or replace function public.increment_visitor_count(p_profile_id uuid)
returns void language sql security definer as $$
  update public.profiles set visitor_count = visitor_count + 1 where id = p_profile_id;
$$;

grant execute on function public.increment_visitor_count(uuid) to anon, authenticated;
