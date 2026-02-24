-- Replace the existing function with SECURITY DEFINER and handle NULL values for is_found
CREATE OR REPLACE FUNCTION increment_score_on_claim()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if the cache was just found (handle NULL case as well)
  IF (OLD.is_found IS FALSE OR OLD.is_found IS NULL) AND NEW.is_found = TRUE AND NEW.found_by IS NOT NULL THEN
    UPDATE users
    SET score = score + 1
    WHERE id = NEW.found_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
