-- FlipScout RLS hardening — run this in the Supabase SQL editor.
--
-- Prerequisite: 0001_init.sql plus the deals/watchlists user_id + RLS
-- policies. This migration locks down the REMAINING tables, which are
-- otherwise readable AND writable by anyone holding the public anon key.

-- Catalog: readable by signed-in users, not writable from the client.
alter table components enable row level security;
create policy "Authenticated users can read catalog"
  on components for select
  to authenticated
  using (true);
-- (no insert/update/delete policies → writes are blocked)

-- Join/history tables: not used by the app yet — lock them entirely.
alter table deal_components enable row level security;
alter table status_history enable row level security;
alter table watchlist_hits enable row level security;
-- (no policies → no access via the anon key at all)

-- ---------------------------------------------------------------
-- OPTIONAL: claim rows created before auth existed.
-- Deals/watchlists inserted before the user_id column have user_id NULL
-- and are invisible to everyone under RLS. To adopt them into your
-- account, find your user id in Authentication → Users, then run:
--
--   update deals set user_id = 'YOUR-USER-UUID' where user_id is null;
--   update watchlists set user_id = 'YOUR-USER-UUID' where user_id is null;
--
-- Or simply delete the test rows:
--
--   delete from deals where user_id is null;
--   delete from watchlists where user_id is null;
-- ---------------------------------------------------------------
