-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create caches table
CREATE TABLE public.caches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    hint TEXT,
    secret_code TEXT NOT NULL,
    is_found BOOLEAN DEFAULT FALSE,
    found_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caches ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow public read access to caches (anyone can see caches on the map)
CREATE POLICY "Public caches are viewable by everyone" ON public.caches
    FOR SELECT USING (true);

-- Allow public read access to users (for leaderboard/status)
CREATE POLICY "Public users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Allow playing anonymously for now (simplify RLS for Sprint 2)
-- In a real app, we'd restrict updates to the user who found it or admin
CREATE POLICY "Public can update caches (finding)" ON public.caches
    FOR UPDATE USING (true);

CREATE POLICY "Public can insert users (registration)" ON public.users
    FOR INSERT WITH CHECK (true);

-- Seed Data (Mock Caches)
INSERT INTO public.caches (id, name, lat, lng, hint, secret_code) VALUES
    ('1a2b3c4d-0001-4000-a000-000000000001', 'The Old Library Steps', 17.5946, 78.1226, 'Look under the third brick from the left on the entrance steps.', 'OAK-TREE-42'),
    ('1a2b3c4d-0002-4000-a000-000000000002', 'Clock Tower Cache', 17.5952, 78.1198, 'Face the clock. Turn right. Behind the bench.', 'TICK-TOCK-99'),
    ('1a2b3c4d-0003-4000-a000-000000000003', 'Basketball Court Stash', 17.5938, 78.1212, 'Magnetized to the underside of the scoreboard.', 'SLAM-DUNK-77'),
    ('1a2b3c4d-0004-4000-a000-000000000004', 'Canteen Corner', 17.5960, 78.1240, 'Under the red fire extinguisher near the back exit.', 'HOT-SAUCE-11'),
    ('1a2b3c4d-0005-4000-a000-000000000005', 'Amphitheatre Drop', 17.5935, 78.1250, 'Second row, seat 14. Taped underneath.', 'ENCORE-55'),
    ('1a2b3c4d-0006-4000-a000-000000000006', 'Parking Lot Echo', 17.5970, 78.1188, 'Inside the yellow bollard cap at row C.', 'VROOM-33');
