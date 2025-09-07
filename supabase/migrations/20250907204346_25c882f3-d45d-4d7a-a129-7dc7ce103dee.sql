-- Fix insecure INSERT policy on wallet_transactions
-- 1) Drop permissive policy allowing anyone to insert
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'wallet_transactions' 
      AND policyname = 'System can insert transactions'
  ) THEN
    EXECUTE 'DROP POLICY "System can insert transactions" ON public.wallet_transactions';
  END IF;
END $$;

-- 2) Do not add a new INSERT policy for authenticated users.
--    With RLS enabled and no INSERT policy, direct client inserts are blocked.
--    Service role (used by Edge Functions) continues to bypass RLS and can insert safely.

-- Note: Keeping existing SELECT policy (Users can view own transactions) unchanged.
