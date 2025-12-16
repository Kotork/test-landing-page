-- Create contact submissions table for admin management
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT NOT NULL,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  subject TEXT,
  message TEXT NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL CHECK (
    status IN ('new', 'open', 'in_progress', 'resolved', 'archived')
  ),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  last_follow_up_at TIMESTAMP,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP,
  archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_submissions_email
  ON contact_submissions (lower(email));

CREATE INDEX idx_contact_submissions_submitted_at
  ON contact_submissions (submitted_at DESC);

CREATE INDEX idx_contact_submissions_status
  ON contact_submissions (status);

CREATE INDEX idx_contact_submissions_archived
  ON contact_submissions (is_archived);

-- Maintain updated_at column
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

