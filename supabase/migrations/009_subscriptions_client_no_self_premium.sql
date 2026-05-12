-- Client JWT cannot mark themselves premium/trial; only service role (webhook, jobs) can.
-- Keeps parity with RevenueCat as source of truth after RLS + webhook/REST sync.

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (public.current_profile_id() = user_id)
  WITH CHECK (
    public.current_profile_id() = user_id
    AND lower(trim(coalesce(status, 'free'))) = 'free'
  );

-- Allow creating a row only as free (upsert insert path); premium rows come from backend/service role.
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    public.current_profile_id() = user_id
    AND lower(trim(coalesce(status, 'free'))) = 'free'
  );
