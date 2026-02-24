-- Allow everyone to read caches (idempotent if already exists)
-- We need this because enabling RLS might block reads if no policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'caches' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.caches FOR SELECT USING (true);
    END IF;
END
$$;

-- Allow updates to caches (so users can mark them as found)
CREATE POLICY "Enable update for all users"
ON public.caches
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.caches ENABLE ROW LEVEL SECURITY;
