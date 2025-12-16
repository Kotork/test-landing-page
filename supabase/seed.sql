-- Seed file for initial database setup
DO $$
DECLARE
  user_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if user already exists by email
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = 'r.fmateus@hotmail.com'
  LIMIT 1;

  -- Only insert if user doesn't exist
  IF existing_user_id IS NULL THEN
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
      '$2a$10$rOzJwX1Z5Y5Y5Y5Y5Y5Y5Ou5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', -- Pre-computed hash for '123456'
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
    RETURNING id INTO user_id;
  ELSE
    -- Use existing user ID
    user_id := existing_user_id;
  END IF;

  -- Ensure public.users record exists with staff role
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