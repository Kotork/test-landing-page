# Admin User Management Overview

This document captures how to use and maintain the admin-facing user management feature that powers `/admin/users`.

## Feature Summary

- **Protected route** available at `/admin/users` under the admin layout.
- **Server-driven table** with pagination, sorting, global search, and role/status/lock filters.
- **User profile dialog** supports creating new accounts or editing existing ones with inline validation.
- **Contextual row actions** surface disabling, locking, unlocking, password reset requirements, and onboarding email resend.
- **Audit logging** persists acting administrator IDs for create/update flows via the `user_audit_logs` table.
- **Feedback UX** uses shadcn toasts and confirmation dialogs for destructive operations.

## Access Control & Middleware

- Admin layout wraps all admin routes and now redirects unauthenticated users to `/login` and unauthorized roles to `/forbidden`.
- API routes in `app/api/admin/users` validate the session with `requireAuth("staff")` and return `401` or `403` JSON responses when necessary.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is defined on the server so service-admin operations (creating auth users, sending invites, updating metadata) work.

## Database Changes

Migration `015_add_admin_user_fields.sql` adds:

- Extended `users` table columns (`full_name`, `status`, `is_locked`, `locked_at`, `last_login_at`, `password_reset_required`, `created_by`, `updated_by`, `disabled_reason`, `onboarding_note`, `invited_at`).
- Supporting indexes on status/role/last login.
- New `user_audit_logs` table for traceability.

## APIs & Validation

- `GET /api/admin/users`: server-side pagination, sorting, and filtering; optionally enriches last login using the Supabase admin client.
- `POST /api/admin/users`: creates an auth user (password or onboarding email) and corresponding profile record.
- `PATCH /api/admin/users/:id`: updates profile metadata, enforces destructive confirmations, syncs auth metadata, and logs audit entries.
- Validation is centralized in `lib/users/schema.ts`; `createUserSchema` and `updateUserSchema` are shared between server actions and client forms.

## UI Contracts

- Table and form components live in `app/(admin)/admin/users/users-page.tsx`.
- Uses shadcn UI primitives (`table`, `dialog`, `select`, `switch`, `toast`, `alert-dialog`) plus TanStack Table for server-controlled data.
- Toast provider (`<Toaster />`) is mounted in `app/layout.tsx`.
- New nav entry added to `app/(admin)/layout.tsx`.

## Testing

- Run `pnpm test` (configured with Vitest + Testing Library + jsdom).
- Coverage targets schemas, service-layer edge cases, and renders critical UI states (data load and dialog open).
- Setup lives in `vitest.config.ts` and `vitest.setup.ts`.

## Operational Notes

- Destructive actions (disable, lock, password reset) require explicit confirmations and produce audit log entries.
- The create user endpoint requires either a strong password or `sendOnboardingEmail = true`; UI enforces this rule.
- When onboarding is triggered, ensure Supabase SMTP settings are configured; otherwise admins must share generated passwords manually.
- The `/forbidden` page halts indexing and provides a basic 403 message for non-staff accounts.
