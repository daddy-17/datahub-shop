-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data bundles table
CREATE TABLE public.data_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network TEXT NOT NULL CHECK (network IN ('yello', 'telecel', 'airteltigo')),
  capacity TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  validity TEXT DEFAULT '30 days',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bundle_id UUID NOT NULL REFERENCES public.data_bundles(id),
  receiver_phone TEXT NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for data_bundles (public read)
CREATE POLICY "Anyone can view active bundles" ON public.data_bundles
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage bundles" ON public.data_bundles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true
  ));

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true
  ));

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone_number)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data bundles
INSERT INTO public.data_bundles (network, capacity, price, validity) VALUES
  ('yello', '1GB', 5.00, '24 hours'),
  ('yello', '3GB', 12.00, '3 days'),
  ('yello', '6GB', 20.00, '7 days'),
  ('yello', '12GB', 35.00, '30 days'),
  ('telecel', '1GB', 4.50, '24 hours'),
  ('telecel', '5GB', 18.00, '7 days'),
  ('telecel', '10GB', 32.00, '30 days'),
  ('airteltigo', '2GB', 8.00, '3 days'),
  ('airteltigo', '8GB', 25.00, '15 days'),
  ('airteltigo', '15GB', 45.00, '30 days');

-- Create function to update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT,
  p_reference TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;