-- Allow authenticated users (Admins) to manage caches
CREATE POLICY "Admins can insert caches" ON public.caches
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update caches" ON public.caches
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete caches" ON public.caches
    FOR DELETE TO authenticated USING (true);

-- Ensure public read access remains (already covered by "Public caches are viewable by everyone" in init_schema, but good to be explicit/safe if we change things later)
-- The existing policy "Public caches are viewable by everyone" covers SELECT for public (and thus authenticated).
