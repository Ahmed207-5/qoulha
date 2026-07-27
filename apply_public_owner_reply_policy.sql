-- Run this once against your existing database to apply the RLS fix from
-- 0025_conversation_messages.sql (owner's reply not showing on the Public
-- Wall). Additive only: adds one new SELECT policy, does not touch the
-- existing "Owner or original sender can view their conversation" policy,
-- any insert policy, the table, or any data. Safe to run multiple times.

drop policy if exists "Anyone can view the owner's reply on a published message" on public.conversation_messages;

create policy "Anyone can view the owner's reply on a published message"
  on public.conversation_messages for select
  using (
    sender_role = 'owner'
    and exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );
