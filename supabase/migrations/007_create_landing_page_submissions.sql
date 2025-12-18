-- Create landing_page_submissions table
-- Generic table for custom data storage from landing pages

CREATE TABLE landing_page_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Flexible JSON structure for custom data
  submission_type TEXT NOT NULL CHECK (submission_type IN ('newsletter', 'contact', 'analytics', 'custom')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on landing_page_id for faster lookups
CREATE INDEX idx_landing_page_submissions_landing_page_id ON landing_page_submissions(landing_page_id);

-- Create index on submission_type for filtering
CREATE INDEX idx_landing_page_submissions_type ON landing_page_submissions(submission_type);

-- Create index on created_at for date range queries
CREATE INDEX idx_landing_page_submissions_created_at ON landing_page_submissions(created_at);

-- Enable Row Level Security
ALTER TABLE landing_page_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read submissions for landing pages from their organization
CREATE POLICY "Users can read own organization submissions"
  ON landing_page_submissions
  FOR SELECT
  USING (
    landing_page_id IN (
      SELECT lp.id
      FROM landing_pages lp
      INNER JOIN users u ON lp.organization_id = u.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- RLS Policy: Staff can read all submissions
CREATE POLICY "Staff can read all submissions"
  ON landing_page_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

-- RLS Policy: Allow API key access to insert submissions
-- This policy allows inserts without auth.uid() for API key authentication
-- The API route will validate the API key before allowing insert
CREATE POLICY "Allow API key inserts"
  ON landing_page_submissions
  FOR INSERT
  WITH CHECK (true); -- API route validates API key and landing_page_id

-- Note: API key validation happens in the application layer
-- The API route ensures the landing_page_id matches the API key's landing page
