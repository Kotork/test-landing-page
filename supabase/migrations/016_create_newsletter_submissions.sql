-- Create newsletter submissions table for admin management
CREATE TABLE newsletter_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status TEXT NOT NULL CHECK (
    subscription_status IN ('pending', 'subscribed', 'unsubscribed', 'bounced')
  ),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  bounce_reason TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP,
  archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, email)
);

CREATE INDEX idx_newsletter_submissions_email
  ON newsletter_submissions (lower(email));

CREATE INDEX idx_newsletter_submissions_submitted_at
  ON newsletter_submissions (submitted_at DESC);

CREATE INDEX idx_newsletter_submissions_status
  ON newsletter_submissions (subscription_status);

CREATE INDEX idx_newsletter_submissions_archived
  ON newsletter_submissions (is_archived);

-- Ensure updated_at stays in sync
CREATE TRIGGER update_newsletter_submissions_updated_at
  BEFORE UPDATE ON newsletter_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


