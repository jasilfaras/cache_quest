-- Enable read access for all users on 'users' table (for Leaderboard)
CREATE POLICY "Enable read access for all users"
ON public.users
FOR SELECT
USING (true);

-- Ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
