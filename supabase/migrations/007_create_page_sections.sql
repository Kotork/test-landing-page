-- Create page_sections table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES section_templates(id),
  order_index INTEGER NOT NULL,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

