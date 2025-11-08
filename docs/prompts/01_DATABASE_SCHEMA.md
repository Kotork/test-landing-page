# Database Schema - Supabase

## Core Tables

### `users` (extends Supabase auth.users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'customer')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

- `id`: UUID, primary key, references auth.users
- `email`: Text, unique
- `role`: Enum ('staff', 'customer')
- `customer_id`: UUID, nullable, references customers.id (only for customer role)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `customers`

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

- `id`: UUID, primary key
- `name`: Text
- `subdomain`: Text, unique (e.g., 'acme' for acme.yourapp.com)
- `logo_url`: Text, nullable
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `created_by`: UUID, references users.id (staff who created)

### `landing_pages`

```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  structured_data JSONB,
  branding JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, slug)
);
```

- `id`: UUID, primary key
- `customer_id`: UUID, references customers.id
- `slug`: Text (URL slug for the page)
- `title`: Text
- `meta_title`: Text, nullable
- `meta_description`: Text, nullable
- `meta_keywords`: Text, nullable
- `og_image`: Text, nullable
- `structured_data`: JSONB, nullable (JSON-LD schema)
- `branding`: JSONB ({ primaryColor, secondaryColor, font, logo })
- `is_published`: Boolean, default false
- `published_at`: Timestamp, nullable
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `section_templates`

```sql
CREATE TABLE section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  component_name TEXT NOT NULL,
  default_config JSONB DEFAULT '{}',
  category TEXT NOT NULL,
  is_form_section BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- `id`: UUID, primary key
- `name`: Text ('Hero', 'Features', 'Testimonials', etc.)
- `component_name`: Text (React component identifier)
- `default_config`: JSONB (Default configuration)
- `category`: Text ('header', 'content', 'form', 'footer')
- `is_form_section`: Boolean, default false
- `created_at`: Timestamp

### `page_sections`

```sql
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
```

- `id`: UUID, primary key
- `landing_page_id`: UUID, references landing_pages.id
- `template_id`: UUID, references section_templates.id
- `order_index`: Integer (for drag-and-drop ordering)
- `content`: JSONB (section-specific content/data)
- `is_active`: Boolean, default true
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `form_fields`

```sql
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
```

- `id`: UUID, primary key
- `section_id`: UUID, references page_sections.id
- `field_type`: Enum ('text', 'email', 'phone', 'select', 'checkbox', 'file')
- `label`: Text
- `placeholder`: Text, nullable
- `is_required`: Boolean, default false
- `validation_rules`: JSONB, nullable (min, max, pattern, etc.)
- `options`: JSONB, nullable (for select/checkbox fields)
- `order_index`: Integer
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `form_submissions`

```sql
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
```

- `id`: UUID, primary key
- `section_id`: UUID, references page_sections.id
- `landing_page_id`: UUID, references landing_pages.id
- `customer_id`: UUID, references customers.id
- `submission_data`: JSONB ({ field_id: value })
- `ip_address`: INET, nullable
- `user_agent`: Text, nullable
- `spam_score`: Float, nullable (from spam protection)
- `is_spam`: Boolean, default false
- `created_at`: Timestamp

### `contacts`

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  source_landing_page_id UUID REFERENCES landing_pages(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, email)
);
```

- `id`: UUID, primary key
- `customer_id`: UUID, references customers.id
- `email`: Text
- `name`: Text, nullable
- `phone`: Text, nullable
- `source_landing_page_id`: UUID, references landing_pages.id
- `metadata`: JSONB, nullable (additional fields)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### `analytics_events`

```sql
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
```

- `id`: UUID, primary key
- `landing_page_id`: UUID, references landing_pages.id
- `customer_id`: UUID, references customers.id
- `event_type`: Enum ('page_view', 'form_submission', 'click', 'scroll')
- `event_data`: JSONB, nullable
- `ip_address`: INET, nullable
- `user_agent`: Text, nullable
- `referrer`: Text, nullable
- `session_id`: Text, nullable
- `created_at`: Timestamp

### `custom_domains` (Premium Feature)

```sql
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  ssl_certificate TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

- `id`: UUID, primary key
- `customer_id`: UUID, references customers.id
- `domain`: Text, unique
- `is_verified`: Boolean, default false
- `verification_token`: Text, nullable
- `ssl_certificate`: Text, nullable
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Indexes

```sql
CREATE INDEX idx_landing_pages_customer_slug ON landing_pages(customer_id, slug);
CREATE INDEX idx_page_sections_landing_page_order ON page_sections(landing_page_id, order_index);
CREATE INDEX idx_form_submissions_landing_page ON form_submissions(landing_page_id, created_at);
CREATE INDEX idx_analytics_events_landing_page_date ON analytics_events(landing_page_id, created_at);
CREATE INDEX idx_customers_subdomain ON customers(subdomain);
CREATE INDEX idx_contacts_customer_email ON contacts(customer_id, email);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
```

## Row Level Security (RLS) Policies

### Staff Access

- Can read/write all tables
- Full access to all customers and landing pages

### Customer Access

- Can only read/write their own data (where customer_id matches)
- Can read their own landing pages, sections, form submissions, contacts, analytics
- Cannot access other customers' data

### Public Access

- Can read published landing pages and sections
- Can insert form submissions (with rate limiting)
- Cannot read form submissions or contacts
