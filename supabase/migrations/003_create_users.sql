-- Create users table (extends Supabase auth.users)
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'customer')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

