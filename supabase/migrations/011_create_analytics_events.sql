-- Create analytics_events table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'form_submission', 'click', 'scroll')),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

