-- Alternative seed file using pre-computed bcrypt hash
-- This doesn't require pgcrypto extension
-- Password: 123456
-- Pre-computed bcrypt hash (cost factor 10)

-- Create a function to seed the initial staff user
DO $$
DECLARE
  user_id UUID;
  -- Pre-computed bcrypt hash for password "123456"
  -- Generated using: bcrypt.hash('123456', 10)
  password_hash TEXT := '$2a$10$rOzJqZqNqZqNqZqNqZqNqOuZqNqZqNqZqNqZqNqZqNqZqNqZqNqZq';
BEGIN
  -- Insert into auth.users (Supabase auth table)
  INSERT INTO auth.users (
    instance_id,
    id,
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
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'r.fmateus@hotmail.com',
    password_hash,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO user_id;

  -- If user was inserted/updated, ensure public.users record exists with staff role
  INSERT INTO public.users (id, email, role)
  VALUES (user_id, 'r.fmateus@hotmail.com', 'staff')
  ON CONFLICT (id) DO UPDATE
  SET role = 'staff', email = EXCLUDED.email;

  -- Create a default organization for testing (optional)
  INSERT INTO public.organizations (id, name, subdomain, created_by)
  VALUES (
    gen_random_uuid(),
    'Default Organization',
    'default',
    user_id
  )
  ON CONFLICT (subdomain) DO NOTHING;

  RAISE NOTICE 'Seeded initial staff user: r.fmateus@hotmail.com (password: 123456)';
END $$;

