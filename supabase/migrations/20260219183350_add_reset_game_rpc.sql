-- Create a function to reset the game state
-- This can be called from the frontend by an admin

CREATE OR REPLACE FUNCTION reset_game()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Mark all caches as not found
  UPDATE public.caches
  SET is_found = FALSE,
      found_by = NULL;

  -- 2. Optional: Delete all users (or just reset scores)
  -- For this version, we'll keep the users but reset their state if needed.
  -- Since users are just team names for now, we can leave them or delete them.
  -- Let's delete them to force a fresh "login" for a new game.
  DELETE FROM public.users;

END;
$$;
