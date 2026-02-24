-- Replace the existing function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION increment_score_on_claim()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if the cache was just found
  IF OLD.is_found = false AND NEW.is_found = true AND NEW.found_by IS NOT NULL THEN
    UPDATE users
    SET score = score + 1
    WHERE id = NEW.found_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger itself doesn't need to change, but recreating the function updates its permissions.
