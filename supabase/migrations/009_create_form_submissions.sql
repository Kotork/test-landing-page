-- Create form_submissions table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL,
  ip_address INET,
  user_agent TEXT,
  spam_score FLOAT,
  is_spam BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

