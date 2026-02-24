-- Seed Caches
INSERT INTO public.caches (name, lat, lng, hint, secret_code, is_found, found_by)
VALUES
  ('The Old Library Steps', 17.5955, 78.1205, 'Look under the third step from the bottom.', 'BOOKWORM-23', false, null),
  ('Clock Tower Cache', 17.5952, 78.1198, 'Face the clock. Turn right. Behind the bench.', 'TICK-TOCK-99', false, null),
  ('Amphitheatre Drop', 17.5948, 78.1210, 'Center stage, hidden in the cracks.', 'ENCORE-55', false, null),
  ('Cafeteria Corner', 17.5960, 78.1215, 'Where the coffee smells strongest.', 'LATTE-ART-01', false, null),
  ('Garden Gazebo', 17.5940, 78.1200, 'Under the wooden bench.', 'GREEN-THUMB-77', false, null);

-- Optional: Seed a test user (User will likely create their own, but good for testing)
-- INSERT INTO public.users (team_name, score) VALUES ('TestTeam', 0);
