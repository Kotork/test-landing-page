-- Create landing_pages table
-- Each organization can have multiple landing pages

CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- Unique identifier for the landing page
  domain TEXT, -- Optional custom domain
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(organization_id, slug)
);

-- Create index on slug for faster lookups
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);

-- Create index on organization_id for faster queries
CREATE INDEX idx_landing_pages_organization_id ON landing_pages(organization_id);

-- Trigger for automatic updated_at timestamp updates
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read landing pages from their organization
CREATE POLICY "Users can read own organization landing pages"
  ON landing_pages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Staff can read all landing pages
CREATE POLICY "Staff can read all landing pages"
  ON landing_pages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

-- RLS Policy: Users can insert landing pages for their organization
CREATE POLICY "Users can insert own organization landing pages"
  ON landing_pages
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- RLS Policy: Users can update landing pages from their organization
CREATE POLICY "Users can update own organization landing pages"
  ON landing_pages
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can delete landing pages from their organization
CREATE POLICY "Users can delete own organization landing pages"
  ON landing_pages
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Staff can insert landing pages for any organization
CREATE POLICY "Staff can insert landing pages for any organization"
  ON landing_pages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
    AND created_by = auth.uid()
  );