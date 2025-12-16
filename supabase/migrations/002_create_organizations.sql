-- Create organizations table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md
-- Note: Foreign key constraints will be added in migration 003 after both tables exist

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

