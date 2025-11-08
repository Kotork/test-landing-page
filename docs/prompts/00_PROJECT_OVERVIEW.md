# Project Overview - Landing Page Generator

## Objective

Build a comprehensive multi-tenant landing page generator application with three distinct user roles:

- **Staff (Admin)**: Manage all customers and landing pages
- **Customers**: Create and manage their landing pages and contacts
- **End Users**: View landing pages and submit contact forms anonymously

The application enables customers to create, manage, and optimize SEO/AEO landing pages to capture leads through form submissions.

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

## Key Features

1. **Multi-Tenancy**: Subdomain-based routing (customer.buzzapy.com)
2. **Section Builder**: Drag-and-drop section editor with templates
3. **Form Management**: Dynamic form builder with validation
4. **SEO/AEO Optimization**: Meta tags, structured data, sitemaps
5. **Analytics**: Page views, form submissions, conversion tracking
6. **Contact Management**: Aggregate and manage form submissions
7. **Branding**: Per-landing-page customization (colors, fonts, logo)
8. **Custom Domains**: Premium feature for custom domain support

## Implementation Phases

1. **Phase 1**: Foundation (Project setup, Supabase, Auth)
2. **Phase 2**: Multi-Tenancy (Subdomain routing, RLS)
3. **Phase 3**: Section System (Templates, Builder, Drag-and-drop)
4. **Phase 4**: Landing Pages (CRUD, Renderer, Forms)
5. **Phase 5**: Backoffice (Admin & Customer dashboards)
6. **Phase 6**: SEO/AEO (Meta tags, Structured data, Sitemaps)
7. **Phase 7**: Analytics (Tracking, Dashboards, Integrations)
8. **Phase 8**: Polish (Email, Spam protection, Optimization)

## Key Implementation Notes

- Always use server-side Supabase client for authenticated operations
- Validate all inputs on both client and server
- Use TypeScript for type safety
- Follow mobile-first design approach
- Implement proper error handling and user feedback
- Use optimistic UI updates for better UX
- Cache frequently accessed data where appropriate
- Monitor performance and optimize queries
- Test on multiple devices and browsers
- Document complex logic with comments
