-- Create section_templates table
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE TABLE section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  default_config JSONB DEFAULT '{}',
  category TEXT NOT NULL,
  is_form_section BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

