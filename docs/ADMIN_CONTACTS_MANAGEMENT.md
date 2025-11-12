# Admin Contacts & Newsletter Management

This feature consolidates newsletter subscriptions and contact form messages for staff operating under `/admin/contacts`. The route resides inside the admin layout, inherits existing permission checks, and is excluded from indexing via route metadata.

## Data Model

Two migrations introduce dedicated tables:

- `016_create_newsletter_submissions.sql` – adds `newsletter_submissions` with subscription status, marketing preference, audit metadata, and soft-delete fields (`is_archived`, `archived_at/by/reason`). Unique constraint prevents duplicate active subscriptions per `customer_id + email`.
- `017_create_contact_submissions.sql` – adds `contact_submissions` with message content, lifecycle status, marketing flag, and soft-delete metadata.

Both tables share `created_by` / `updated_by` references to admin users. Trigger `update_updated_at_column` keeps timestamps fresh. Migration `018_create_admin_activity_logs.sql` introduces a generic `admin_activity_logs` table used to record destructive/critical operations (archives, status changes) with the acting admin ID.

## Backend APIs

Endpoints live under `app/api/admin` and are protected via `requireAuth("staff")`; unauthenticated callers receive `401/403`. Each handler returns structured JSON with consistent validation errors:

- `GET /api/admin/newsletter-submissions` – server-side pagination, sorting, search, and filters (status, marketing opt-in, date range, archived view).
- `POST /api/admin/newsletter-submissions` – validates payload, enforces uniqueness, writes Supabase rows, and logs activity.
- `PATCH /api/admin/newsletter-submissions/:id` – updates metadata, handles soft deletes (archive/unarchive), and records audit entries.
- `GET /api/admin/contact-submissions` / `POST ...` / `PATCH ...` mirror the functionality for contact messages, including status transitions and archive flows.

Zod schemas in `lib/contacts/schema.ts` centralize validation. `lib/contacts/service.ts` encapsulates Supabase access patterns, duplicate checks, auditing, and shared error serialization.

## Front-End UX

The `ContactsPage` client component (`app/(admin)/admin/contacts/contacts-page.tsx`) renders:

- Radix Tabs for `Newsletter` and `Contacts` tables, powered by TanStack Table + shadcn UI.
- Global search, marketing/status/date filters, archived toggles, pagination controls, and responsive layouts.
- Actions per tab: primary `New Newsletter` / `New Contact` buttons, row dropdowns for edit/archive, and confirmation dialogs for destructive actions.
- Dialog-driven forms with React Hook Form, inline validation, toasts, and accessible labels/descriptions. Immutable fields (submission timestamp) remain server-controlled.
- Contact messages support a “View message” modal for expanded content.

Success/error states surface via the global toast provider (`app/layout.tsx` already mounts `<Toaster />`). Soft deletes update archive flags while retaining records.

## Testing

Vitest + Testing Library cover:

- Schema validation edge cases (`__tests__/contacts/schema.test.ts`).
- Service-layer behaviour for creation, archiving, and error serialization (`__tests__/contacts/service.test.ts`).
- UI smoke test ensuring both tabs render and fetch data (`__tests__/app/contacts-page.test.tsx`).

Run `pnpm test` (Vitest) to execute the suite. `vitest.setup.ts` supplies `crypto.randomUUID` and `ResizeObserver` polyfills for jsdom.

## Operational Notes

- Define `SUPABASE_SERVICE_ROLE_KEY` when deploying so admin routes can perform privileged operations.
- Soft-deleted entries remain queryable when `includeArchived=true`; restoring simply flips `is_archived` off.
- Activity logs (table `admin_activity_logs`) provide traceability for compliance; extend filtering/reporting as needed.
- Keep Supabase email templates configured so onboarding notifications and follow-up workflows deliver as expected.


