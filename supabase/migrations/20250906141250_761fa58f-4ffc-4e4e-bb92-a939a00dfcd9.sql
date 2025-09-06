-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Fix wallet function security by setting search_path
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT,
  p_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  -- Get current balance
  SELECT wallet_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Check if debit amount exceeds balance
  IF p_type = 'debit' AND current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update wallet balance
  IF p_type = 'credit' THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (user_id, amount, type, description, reference)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference);
  
  RETURN TRUE;
END;
$$;