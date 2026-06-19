-- Prevent authenticated/anon clients from self-granting premium via profiles flags.
-- Service role/webhooks/scripts may still manage these columns.

CREATE OR REPLACE FUNCTION public.block_client_profile_premium_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text :=
    lower(
      coalesce(
        nullif(current_setting('request.jwt.claims', true), '')::json->>'role',
        ''
      )
    );
  is_service_role boolean := jwt_role = 'service_role' OR current_user = 'postgres';
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (coalesce(NEW.is_premium, false) = true
        OR lower(trim(coalesce(NEW.subscription_status, 'free'))) <> 'free')
       AND NOT is_service_role THEN
      RAISE EXCEPTION 'Only service role may set premium profile flags';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (coalesce(NEW.is_premium, false) IS DISTINCT FROM coalesce(OLD.is_premium, false)
        OR coalesce(NEW.subscription_status, 'free') IS DISTINCT FROM coalesce(OLD.subscription_status, 'free'))
       AND NOT is_service_role THEN
      RAISE EXCEPTION 'Only service role may modify premium profile flags';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_premium_server_only ON public.profiles;
CREATE TRIGGER trg_profiles_premium_server_only
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.block_client_profile_premium_changes();
