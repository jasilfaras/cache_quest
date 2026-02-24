-- Function to increment score
CREATE OR REPLACE FUNCTION increment_score_on_claim()
RETURNS TRIGGER AS $$
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

-- Trigger to call the function
CREATE TRIGGER on_cache_claim
AFTER UPDATE ON caches
FOR EACH ROW
EXECUTE FUNCTION increment_score_on_claim();
