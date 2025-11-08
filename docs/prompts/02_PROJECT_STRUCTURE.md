# Project Structure

## File Organization

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

## Naming Conventions

- **Components**: PascalCase (e.g., `SectionBuilder.tsx`)
- **Files**: kebab-case for routes, PascalCase for components
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE

## Route Groups

- `(admin)`: Admin-only routes, requires 'staff' role
- `(customer)`: Customer-only routes, requires 'customer' role
- `[subdomain]`: Public dynamic routes for landing pages

## Component Organization

- **Admin components**: `components/admin/`
- **Customer components**: `components/customer/`
- **Builder components**: `components/builder/`
- **Section components**: `components/sections/`
- **Shared UI**: `components/ui/` (shadcn/ui)
- **Shared utilities**: `components/shared/`
