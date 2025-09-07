-- Create an admin user in the profiles table
-- First, create a test admin account
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@datahub.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User","phone_number":"0241234567"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create the admin profile
INSERT INTO public.profiles (
  user_id,
  full_name,
  phone_number,
  is_admin,
  wallet_balance
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Admin User',
  '0241234567',
  true,
  1000.00
) ON CONFLICT (user_id) DO UPDATE SET
  is_admin = true,
  wallet_balance = 1000.00;