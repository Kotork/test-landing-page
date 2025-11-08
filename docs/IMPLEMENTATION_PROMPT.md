# Landing Page Generator - AI Implementation Guide

## Project Overview

Build a comprehensive multi-tenant landing page generator application with three distinct user roles: Staff (admin), Customers (agency clients), and End Users (visitors). The application enables customers to create, manage, and optimize SEO/AEO landing pages to capture leads through form submissions.

## Technology Stack

- **Framework**: Next.js 15+ (App Router) with TypeScript
- **Database & Auth**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **Styling**: TailwindCSS with mobile-first approach
- **UI Components**: shadcn/ui component library
- **Form Management**: react-hook-form + zod for validation
- **Drag & Drop**: @dnd-kit/core for section reordering
- **Email**: Resend API (via Supabase Edge Functions)
- **Spam Protection**: reCAPTCHA v3 or hCaptcha
- **Analytics**: Google Analytics + PostHog integration
- **SEO**: next-seo or custom meta tag management

## User Roles & Permissions

### 1. Staff (Admin)
- Full access to all customers and landing pages
- Can create customer accounts
- View aggregated analytics across all customers
- Manage all users and landing pages

### 2. Customer
- Can create and manage multiple landing pages
- Edit landing page sections (drag-and-drop)
- View form submissions and manage contacts
- Customize branding per landing page
- Configure SEO/AEO settings
- View their own analytics

### 3. End User (Public)
- No authentication required
- Can view landing pages and submit contact forms
- Anonymous form submissions

## Database Schema (Supabase)

### Core Tables

#### `users` (extends Supabase auth.users)
```sql
- id (uuid, primary key, references auth.users)
- email (text, unique)
- role (enum: 'staff', 'customer')
- customer_id (uuid, nullable, references customers.id) -- only for customer role
- created_at (timestamp)
- updated_at (timestamp)
```

#### `customers`
```sql
- id (uuid, primary key)
- name (text)
- subdomain (text, unique) -- e.g., 'acme' for acme.yourapp.com
- custom_domain (text, nullable, unique) -- premium feature
- logo_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, references users.id) -- staff who created
```

#### `landing_pages`
```sql
- id (uuid, primary key)
- customer_id (uuid, references customers.id)
- slug (text) -- URL slug for the page
- title (text)
- meta_title (text, nullable)
- meta_description (text, nullable)
- meta_keywords (text, nullable)
- og_image (text, nullable)
- structured_data (jsonb, nullable) -- JSON-LD schema
- branding (jsonb) -- { primaryColor, secondaryColor, font, logo }
- is_published (boolean, default false)
- published_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(customer_id, slug)
```

#### `section_templates`
```sql
- id (uuid, primary key)
- name (text) -- 'Hero', 'Features', 'Testimonials', etc.
- component_name (text) -- React component identifier
- default_config (jsonb) -- Default configuration
- category (text) -- 'header', 'content', 'form', 'footer'
- is_form_section (boolean, default false)
- created_at (timestamp)
```

#### `page_sections`
```sql
- id (uuid, primary key)
- landing_page_id (uuid, references landing_pages.id)
- template_id (uuid, references section_templates.id)
- order_index (integer) -- for drag-and-drop ordering
- content (jsonb) -- section-specific content/data
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `form_fields`
```sql
- id (uuid, primary key)
- section_id (uuid, references page_sections.id)
- field_type (enum: 'text', 'email', 'phone', 'select', 'checkbox', 'file')
- label (text)
- placeholder (text, nullable)
- is_required (boolean, default false)
- validation_rules (jsonb, nullable) -- min, max, pattern, etc.
- options (jsonb, nullable) -- for select/checkbox fields
- order_index (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `form_submissions`
```sql
- id (uuid, primary key)
- section_id (uuid, references page_sections.id)
- landing_page_id (uuid, references landing_pages.id)
- customer_id (uuid, references customers.id)
- submission_data (jsonb) -- { field_id: value }
- ip_address (inet, nullable)
- user_agent (text, nullable)
- spam_score (float, nullable) -- from spam protection
- is_spam (boolean, default false)
- created_at (timestamp)
```

#### `contacts`
```sql
- id (uuid, primary key)
- customer_id (uuid, references customers.id)
- email (text)
- name (text, nullable)
- phone (text, nullable)
- source_landing_page_id (uuid, references landing_pages.id)
- metadata (jsonb, nullable) -- additional fields
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(customer_id, email)
```

#### `analytics_events`
```sql
- id (uuid, primary key)
- landing_page_id (uuid, references landing_pages.id)
- customer_id (uuid, references customers.id)
- event_type (enum: 'page_view', 'form_submission', 'click', 'scroll')
- event_data (jsonb, nullable)
- ip_address (inet, nullable)
- user_agent (text, nullable)
- referrer (text, nullable)
- session_id (text, nullable)
- created_at (timestamp)
```

#### `custom_domains` (Premium Feature)
```sql
- id (uuid, primary key)
- customer_id (uuid, references customers.id)
- domain (text, unique)
- is_verified (boolean, default false)
- verification_token (text, nullable)
- ssl_certificate (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Row Level Security (RLS) Policies

**Staff Access:**
- Can read/write all tables
- Full access to all customers and landing pages

**Customer Access:**
- Can only read/write their own data (where customer_id matches)
- Can read their own landing pages, sections, form submissions, contacts, analytics
- Cannot access other customers' data

**Public Access:**
- Can read published landing pages and sections
- Can insert form submissions (with rate limiting)
- Cannot read form submissions or contacts

## Project Structure

```
landing-page-generator/
├── app/
│   ├── (admin)/                    # Admin routes (protected)
│   │   ├── layout.tsx              # Admin layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Admin dashboard
│   │   ├── customers/
│   │   │   ├── page.tsx            # Customer list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Customer detail
│   │   │   └── new/
│   │   │       └── page.tsx        # Create customer
│   │   ├── landing-pages/
│   │   │   ├── page.tsx            # All landing pages
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Landing page detail
│   │   └── analytics/
│   │       └── page.tsx            # Aggregated analytics
│   ├── (customer)/                 # Customer routes (protected)
│   │   ├── layout.tsx              # Customer layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Customer dashboard
│   │   ├── landing-pages/
│   │   │   ├── page.tsx            # Landing pages list
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create landing page
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Landing page editor
│   │   │       ├── sections/
│   │   │       │   └── page.tsx    # Section builder
│   │   │       ├── settings/
│   │   │       │   └── page.tsx    # SEO & branding settings
│   │   │       └── preview/
│   │   │           └── page.tsx    # Preview mode
│   │   ├── contacts/
│   │   │   ├── page.tsx            # Contacts list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Contact detail
│   │   └── analytics/
│   │       └── page.tsx            # Customer analytics
│   ├── [subdomain]/                # Public landing pages (dynamic)
│   │   ├── layout.tsx              # Public layout
│   │   └── [slug]/
│   │       └── page.tsx            # Render landing page
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts         # Supabase auth callback
│   │   ├── form-submit/
│   │   │   └── route.ts             # Form submission handler
│   │   ├── analytics/
│   │   │   └── route.ts             # Analytics tracking endpoint
│   │   └── webhooks/
│   │       └── route.ts             # Webhook handlers
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home/landing page
├── components/
│   ├── admin/
│   │   ├── CustomerTable.tsx
│   │   ├── LandingPageTable.tsx
│   │   └── AnalyticsDashboard.tsx
│   ├── customer/
│   │   ├── LandingPageList.tsx
│   │   ├── ContactTable.tsx
│   │   └── AnalyticsWidget.tsx
│   ├── builder/
│   │   ├── SectionBuilder.tsx       # Main builder interface
│   │   ├── DraggableSection.tsx     # Draggable wrapper
│   │   ├── SectionEditor.tsx        # Section content editor
│   │   ├── FormFieldBuilder.tsx     # Form field editor
│   │   └── PreviewPanel.tsx         # Mobile/desktop preview
│   ├── sections/                    # Section components
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   ├── ContactForm.tsx
│   │   ├── CTA.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── Video.tsx
│   │   ├── AboutUs.tsx
│   │   ├── WhatWeDo.tsx
│   │   ├── OurProduct.tsx
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── landing-page/
│   │   ├── LandingPageRenderer.tsx  # Renders sections
│   │   └── FormSubmission.tsx       # Form component
│   ├── ui/                          # shadcn/ui components
│   └── shared/
│       ├── Logo.tsx
│       └── Spinner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client
│   │   ├── middleware.ts             # Middleware client
│   │   └── types.ts                  # Database types
│   ├── utils/
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── validation.ts             # Validation schemas
│   │   └── formatting.ts
│   ├── analytics/
│   │   ├── tracker.ts                # Analytics tracking
│   │   ├── google-analytics.ts
│   │   └── posthog.ts
│   ├── email/
│   │   └── notifications.ts          # Email helpers
│   └── seo/
│       ├── meta-tags.ts              # Meta tag generation
│       ├── structured-data.ts        # JSON-LD generation
│       └── sitemap.ts                # Sitemap generation
├── types/
│   ├── database.types.ts             # Generated Supabase types
│   └── index.ts                      # Custom types
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_indexes.sql
│   └── functions/
│       ├── send-form-notification/
│       │   └── index.ts             # Edge function for emails
│       └── process-analytics/
│           └── index.ts
├── middleware.ts                     # Subdomain routing & auth
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Implementation Details

### 1. Authentication System

**Setup:**
- Configure Supabase Auth with email/password
- Create custom user metadata for roles
- Set up JWT tokens with role claims

**Middleware (`middleware.ts`):**
```typescript
// Detect subdomain and route accordingly
// Protect admin/customer routes
// Handle authentication redirects
```

**Auth Flow:**
1. Staff/Customer login via Supabase Auth
2. Store role in user metadata
3. Middleware checks role and protects routes
4. Server components use server-side Supabase client

**Key Files:**
- `lib/supabase/middleware.ts` - Auth middleware helper
- `lib/utils/auth.ts` - Auth utility functions
- `app/api/auth/callback/route.ts` - Auth callback handler

### 2. Multi-Tenancy & Subdomain Routing

**Subdomain Detection:**
- Use Next.js middleware to detect subdomain from request
- Map subdomain to customer_id
- Route to `[subdomain]/[slug]` for landing pages
- Fallback to main domain for admin/customer backoffice

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  // Route logic based on subdomain
  // Admin/customer routes use main domain
  // Landing pages use subdomain
}
```

**Custom Domain Support:**
- Store custom domain in `custom_domains` table
- DNS verification process
- SSL certificate management (via Supabase or external)

### 3. Section Builder System

**Section Templates:**
Create reusable section components with:
- Editable content (text, images, links)
- Responsive design (mobile-first)
- Configurable styling
- Form field support (for ContactForm section)

**Drag & Drop:**
- Use `@dnd-kit/core` for accessibility
- Save order_index to database on reorder
- Optimistic UI updates
- Undo/redo functionality (optional)

**Section Editor:**
- Rich text editor for text content
- Image upload via Supabase Storage
- Color picker for styling
- Link editor for buttons/CTAs
- Live preview (mobile/tablet/desktop)

**Form Field Builder:**
- Add/remove/reorder form fields
- Configure field types and validation
- Set required/optional
- Preview form layout

**Key Components:**
- `components/builder/SectionBuilder.tsx` - Main interface
- `components/builder/DraggableSection.tsx` - Wrapper with drag handle
- `components/builder/SectionEditor.tsx` - Content editing modal/sidebar
- `components/sections/*.tsx` - Individual section components

### 4. Landing Page Rendering

**Public Landing Page (`app/[subdomain]/[slug]/page.tsx`):**
1. Extract subdomain and slug from URL
2. Query customer by subdomain
3. Query landing page by customer_id and slug
4. Load all sections ordered by order_index
5. Render sections with branding applied
6. Include SEO meta tags and structured data

**Section Rendering:**
- Map section template to React component
- Pass content from page_sections.content
- Apply branding (colors, fonts, logo)
- Handle form submissions

**SEO Implementation:**
- Generate meta tags from landing page settings
- Include Open Graph and Twitter Card tags
- Generate JSON-LD structured data
- Set canonical URL
- Include robots meta tag

**AEO Optimization:**
- Semantic HTML structure
- Clear heading hierarchy (h1, h2, h3)
- Descriptive alt text for images
- Structured content with proper tags
- Schema.org markup for AI parsing

### 5. Form Submission System

**Form Component:**
- Render form fields from form_fields table
- Client-side validation (react-hook-form + zod)
- Spam protection (reCAPTCHA v3)
- File upload handling (Supabase Storage)
- Loading states and error handling

**Submission Flow:**
1. Validate form data client-side
2. Verify spam score (reCAPTCHA)
3. Submit to `/api/form-submit`
4. Server validates and saves to database
5. Create/update contact record
6. Trigger email notification (Edge Function)
7. Return success/error response

**Spam Protection:**
- reCAPTCHA v3 on form load
- Calculate spam score
- Block submissions above threshold
- Log spam attempts

**Email Notifications:**
- Supabase Edge Function triggers on form submission
- Use Resend API to send email
- Include form data and landing page info
- Support HTML email templates

### 6. Analytics System

**Event Tracking:**
- Page views (automatic on landing page load)
- Form submissions
- Button clicks (optional)
- Scroll depth (optional)

**Implementation:**
- Server-side tracking to avoid ad blockers
- Store events in `analytics_events` table
- Aggregate data for dashboards
- Real-time updates (optional with Supabase Realtime)

**Google Analytics:**
- Integrate GA4 via gtag
- Track page views and conversions
- Custom events for form submissions

**PostHog:**
- Initialize PostHog client
- Track user sessions
- Funnel analysis for conversions

**Analytics Dashboards:**
- Admin: Aggregated across all customers
- Customer: Their own data only
- Metrics: Views, submissions, conversion rate, traffic sources

### 7. SEO/AEO Features

**Meta Tags Editor:**
- Title, description, keywords
- Open Graph image
- Twitter Card settings
- Suggestions based on content analysis

**Structured Data:**
- Generate JSON-LD for:
  - Organization
  - WebPage
  - ContactPage
  - FAQPage (if FAQ section exists)
- Validate with Google's Rich Results Test

**Sitemap Generation:**
- Generate sitemap.xml per customer
- Include all published landing pages
- Update on page publish/unpublish
- Route: `[subdomain]/sitemap.xml`

**Robots.txt:**
- Generate per subdomain
- Allow/deny specific paths
- Sitemap reference
- Route: `[subdomain]/robots.txt`

**AEO Best Practices:**
- Clear semantic structure
- Descriptive headings
- Alt text for all images
- Proper link text
- Schema.org markup
- Clean, readable HTML

### 8. Branding System

**Per-Landing-Page Branding:**
- Primary color (hex)
- Secondary color (hex)
- Font family (Google Fonts)
- Logo (image URL)
- Custom CSS (optional, advanced)

**Implementation:**
- Store in `landing_pages.branding` (JSONB)
- Apply via CSS variables in layout
- Preview in builder
- Apply to all sections

### 9. Contact Management

**Contact Aggregation:**
- Auto-create contact from form submission
- Merge duplicate emails (same customer)
- Update contact with latest submission data
- Track source landing page

**Contact List:**
- Filter by date, landing page, status
- Search by name/email
- Export to CSV
- View contact detail with submission history

### 10. Admin Backoffice

**Features:**
- Dashboard with key metrics
- Customer management (CRUD)
- Landing page overview (all customers)
- User management
- Analytics dashboard (aggregated)

**UI:**
- Sidebar navigation
- Data tables with pagination
- Charts/graphs for analytics
- Quick actions (create customer, etc.)

### 11. Customer Backoffice

**Features:**
- Dashboard with their metrics
- Landing page management
- Section builder
- Form submissions viewer
- Contact management
- Analytics dashboard
- Settings (SEO, branding)

**UI:**
- Sidebar navigation
- Drag-and-drop builder
- Form editor
- Preview mode
- Publish/unpublish toggle

## Security Considerations

1. **Row Level Security (RLS):**
   - All tables have RLS enabled
   - Policies based on user role and customer_id
   - Staff can access all, customers only their own

2. **Authentication:**
   - Secure JWT tokens
   - Role-based access control
   - Session management

3. **Form Submissions:**
   - Rate limiting (prevent spam)
   - CSRF protection
   - Input validation and sanitization
   - File upload restrictions

4. **XSS Prevention:**
   - Sanitize user-generated content
   - Use React's built-in XSS protection
   - Validate and escape all inputs

5. **SQL Injection:**
   - Use Supabase client (parameterized queries)
   - Never concatenate SQL strings

6. **Subdomain Security:**
   - Validate subdomain ownership
   - Prevent subdomain hijacking
   - Custom domain verification

## Performance Optimization

1. **Image Optimization:**
   - Use Next.js Image component
   - Supabase Storage with CDN
   - Lazy loading

2. **Database:**
   - Proper indexes on foreign keys
   - Query optimization
   - Connection pooling

3. **Caching:**
   - Static generation for landing pages (ISR)
   - Cache API responses
   - CDN for static assets

4. **Code Splitting:**
   - Dynamic imports for heavy components
   - Route-based code splitting

## Testing Strategy

1. **Unit Tests:**
   - Utility functions
   - Validation schemas
   - Component logic

2. **Integration Tests:**
   - API routes
   - Database operations
   - Auth flows

3. **E2E Tests:**
   - Landing page creation flow
   - Form submission flow
   - Admin operations

## Deployment Checklist

1. **Supabase Setup:**
   - Create project
   - Run migrations
   - Configure auth
   - Set up storage buckets
   - Create Edge Functions
   - Configure RLS policies

2. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
   - `GOOGLE_ANALYTICS_ID`
   - `POSTHOG_KEY`
   - `POSTHOG_HOST`

3. **Next.js Configuration:**
   - Subdomain routing setup
   - Image domains (Supabase)
   - Environment variables

4. **DNS Configuration:**
   - Main domain setup
   - Wildcard subdomain (*.yourapp.com)
   - Custom domain support (if applicable)

## Step-by-Step Implementation Order

1. **Phase 1: Foundation**
   - Initialize Next.js project
   - Set up Supabase
   - Configure TailwindCSS and shadcn/ui
   - Create database schema
   - Set up authentication

2. **Phase 2: Multi-Tenancy**
   - Implement subdomain routing
   - Create customer management
   - Set up RLS policies

3. **Phase 3: Section System**
   - Create section templates
   - Build section components
   - Implement drag-and-drop builder

4. **Phase 4: Landing Pages**
   - Create landing page CRUD
   - Build public renderer
   - Implement form system

5. **Phase 5: Admin & Customer Backoffice**
   - Build admin dashboard
   - Build customer dashboard
   - Implement contact management

6. **Phase 6: SEO/AEO**
   - Meta tags editor
   - Structured data generation
   - Sitemap and robots.txt

7. **Phase 7: Analytics**
   - Event tracking
   - Dashboard implementation
   - Google Analytics & PostHog integration

8. **Phase 8: Polish**
   - Email notifications
   - Spam protection
   - Performance optimization
   - Testing

## Key Implementation Notes

- **Always use server-side Supabase client** for authenticated operations
- **Validate all inputs** on both client and server
- **Use TypeScript** for type safety
- **Follow mobile-first** design approach
- **Implement proper error handling** and user feedback
- **Use optimistic UI updates** for better UX
- **Cache frequently accessed data** where appropriate
- **Monitor performance** and optimize queries
- **Test on multiple devices** and browsers
- **Document complex logic** with comments

## Additional Resources

- Next.js 15 Documentation
- Supabase Documentation
- shadcn/ui Components
- @dnd-kit Documentation
- react-hook-form Documentation
- Zod Documentation
- Resend API Documentation
- Google Analytics 4 Documentation
- PostHog Documentation

---

This document should serve as a comprehensive guide for implementing the landing page generator application. Follow the structure, implement each component systematically, and ensure security and performance are prioritized throughout development.

