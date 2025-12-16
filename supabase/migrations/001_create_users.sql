-- Users table migration
-- This migration consolidates all user-related setup: table, triggers, and RLS policies

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'user')),
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for automatic updated_at timestamp updates on users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user record when auth user is created
-- This ensures that every auth.users entry has a corresponding users table entry
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user' -- Default role, can be changed by admin later
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if user already exists
  RETURN NEW;
END;
$$;

-- Trigger on auth.users table to auto-create user record
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own record
CREATE POLICY "Users can read own record"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own record (for signup fallback)
CREATE POLICY "Users can insert own record"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: Staff access to all users should be handled via service role key
-- or by checking role in application code after fetching own user record
-- This avoids RLS recursion issues

