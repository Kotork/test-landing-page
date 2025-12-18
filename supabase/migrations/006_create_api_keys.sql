-- Create api_keys table
-- API keys are hashed before storage for security

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, -- Hashed API key (never store plain text)
  name TEXT NOT NULL, -- User-friendly name for the key
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP, -- Optional expiration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(key_hash)
);

-- Create index on landing_page_id for faster lookups
CREATE INDEX idx_api_keys_landing_page_id ON api_keys(landing_page_id);

-- Create index on key_hash for faster validation
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Create index on is_active for filtering active keys
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read API keys for landing pages from their organization
CREATE POLICY "Users can read own organization API keys"
  ON api_keys
  FOR SELECT
  USING (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy: Staff can read all API keys
CREATE POLICY "Staff can read all API keys"
  ON api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

-- RLS Policy: Users can insert API keys for landing pages from their organization
CREATE POLICY "Users can insert own organization API keys"
  ON api_keys
  FOR INSERT
  WITH CHECK (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policy: Users can update API keys for landing pages from their organization
CREATE POLICY "Users can update own organization API keys"
  ON api_keys
  FOR UPDATE
  USING (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  )
  WITH CHECK (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy: Users can delete API keys for landing pages from their organization
CREATE POLICY "Users can delete own organization API keys"
  ON api_keys
  FOR DELETE
  USING (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );
