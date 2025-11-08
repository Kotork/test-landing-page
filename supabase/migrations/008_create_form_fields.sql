-- Create form_fields table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'select', 'checkbox', 'file')),
  label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB,
  options JSONB,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

