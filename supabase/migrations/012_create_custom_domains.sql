-- Create custom_domains table (Premium Feature)
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  ssl_certificate TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

