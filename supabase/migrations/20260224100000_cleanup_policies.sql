-- ═══════════════════════════════════════════════════════════════
-- Cleanup: consolidate all vibecoded policies into a clean set
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────
-- 1. Drop ALL existing policies
-- ──────────────────────────────

-- caches policies (6 total from previous migrations)
DROP POLICY IF EXISTS "Public caches are viewable by everyone" ON public.caches;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.caches;
DROP POLICY IF EXISTS "Public can update caches (finding)" ON public.caches;
DROP POLICY IF EXISTS "Enable update for all users" ON public.caches;
DROP POLICY IF EXISTS "Admins can insert caches" ON public.caches;
DROP POLICY IF EXISTS "Admins can update caches" ON public.caches;
DROP POLICY IF EXISTS "Admins can delete caches" ON public.caches;

-- users policies (3 total from previous migrations)
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Public can insert users (registration)" ON public.users;

-- ──────────────────────────────
-- 2. Create clean, minimal policies
-- ──────────────────────────────

-- === CACHES ===

-- Everyone can see caches (map display, game screen)
CREATE POLICY "caches_select_all" ON public.caches
    FOR SELECT USING (true);

-- Anyone can update is_found and found_by (claiming a cache)
CREATE POLICY "caches_update_claim" ON public.caches
    FOR UPDATE USING (true) WITH CHECK (true);

-- Only admins (authenticated) can create caches
CREATE POLICY "caches_insert_admin" ON public.caches
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins (authenticated) can delete caches
CREATE POLICY "caches_delete_admin" ON public.caches
    FOR DELETE TO authenticated USING (true);

-- === USERS ===

-- Everyone can see users (leaderboard)
CREATE POLICY "users_select_all" ON public.users
    FOR SELECT USING (true);

-- Anyone can register (insert a new user/team)
CREATE POLICY "users_insert_all" ON public.users
    FOR INSERT WITH CHECK (true);

-- Anyone can update users (needed for score resets via resetGame)
CREATE POLICY "users_update_all" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

-- ──────────────────────────────
-- 3. Drop abandoned reset_game RPC
--    (replaced by client-side updates in cacheService.ts)
-- ──────────────────────────────
DROP FUNCTION IF EXISTS public.reset_game();

-- ──────────────────────────────
-- 4. Remove stale seed data
--    (IIT Hyderabad coords, wrong campus)
-- ──────────────────────────────
DELETE FROM public.caches WHERE id IN (
    '1a2b3c4d-0001-4000-a000-000000000001',
    '1a2b3c4d-0002-4000-a000-000000000002',
    '1a2b3c4d-0003-4000-a000-000000000003',
    '1a2b3c4d-0004-4000-a000-000000000004',
    '1a2b3c4d-0005-4000-a000-000000000005',
    '1a2b3c4d-0006-4000-a000-000000000006'
);
