-- Create indexes for performance optimization
-- Reference: docs/prompts/01_DATABASE_SCHEMA.md

CREATE INDEX idx_landing_pages_customer_slug ON landing_pages(customer_id, slug);
CREATE INDEX idx_page_sections_landing_page_order ON page_sections(landing_page_id, order_index);
CREATE INDEX idx_form_submissions_landing_page ON form_submissions(landing_page_id, created_at);
CREATE INDEX idx_analytics_events_landing_page_date ON analytics_events(landing_page_id, created_at);
CREATE INDEX idx_customers_subdomain ON customers(subdomain);
CREATE INDEX idx_contacts_customer_email ON contacts(customer_id, email);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);

