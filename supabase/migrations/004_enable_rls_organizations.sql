-- Enable Row Level Security on organizations table
-- This migration enables RLS and creates policies to secure organization data

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read organizations they belong to
-- This allows users to see their own organization
CREATE POLICY "Users can read own organization"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy: Staff users can read all organizations
-- Staff members need to see all organizations for management purposes
CREATE POLICY "Staff can read all organizations"
  ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

-- Policy: Staff users can insert organizations
-- Only staff should be able to create new organizations
CREATE POLICY "Staff can insert organizations"
  ON organizations
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

-- Policy: Staff users can update organizations
-- Only staff should be able to modify organizations
CREATE POLICY "Staff can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

-- Policy: Staff users can delete organizations
-- Only staff should be able to delete organizations
CREATE POLICY "Staff can delete organizations"
  ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

