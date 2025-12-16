**Context**: Admins need to manage user accounts, including reviewing existing users and creating or editing their profiles.

**Task**: Implement an admin dashboard user management experience that lets administrators view the full user list and create or update individual users.

**Requirements**:

1. Add a protected route at `/admin/users` that displays all users in a paginated, sortable table.
   1.1 Use shadcn table and tanstack-table
2. Surface key user attributes (id, name, email, role, status, last login) with quick indicators for locked or pending accounts.
3. Provide a global search box and role/status filters to help admins locate specific users quickly.
4. Include a prominent `New User` action that opens a creation form with inputs for required profile data, role assignment, and password/onboarding options.
5. Enable editing by selecting a user from the list; prepopulate the form, allow role/status changes, and block edits for immutable fields where appropriate.
6. Show inline validation and server error feedback; prevent submissions until required fields pass validation.
7. Confirm destructive changes (e.g., disabling accounts, resetting passwords) before applying them and log the acting admin when possible.

**Technical Requirements**:

- Reuse the admin layout/navigation and add a `Users` entry that respects existing permission checks.
- Expose or extend admin-only API handlers/server actions for listing, creating, and updating users; return structured validation errors.
- Restrict access to admins via middleware/guards and return 403 for unauthorized requests.
- Persist changes to the existing user data store, ensuring role and status updates maintain referential integrity.
- Implement pagination, filtering, and sorting on the server to keep responses performant.
- Sanitize and validate all input (email format, unique constraints, required roles) before persisting; surface helpful error messages.
- Prevent indexing by search engines if the route is publicly addressable.

**UI Requirements**:

- Follow admin design system components for tables, forms, buttons, and alerts to maintain visual consistency.
- Keep the user list responsive; table should collapse gracefully on smaller screens and keep key details visible.
- Use clear CTA hierarchy (`New User` primary, edit actions secondary) and surface contextual actions (disable/reset) via menus.
- Display success and error toasts/snackbars that summarize the action taken.
- Ensure the create/edit form is accessible (labels, focus management, keyboard navigation) and supports cancel/back actions.

**Deliverables**:

- Admin user list route with table view, filtering, and pagination.
- User create/edit form components wired to the admin APIs with validation and feedback states.
- Navigation updates exposing the `Users` section only to authorized admins.
- Tests (unit and/or integration) covering server handlers, form validation, and critical UI states.
- Documentation or handoff notes outlining usage, permissions, and any required environment configuration.

---

**Context**: Admins need to review and maintain all landing-page form submissions so they can follow up with leads and track newsletter growth.

**Task**: Implement an admin contacts experience that lets administrators browse, create, and update newsletter and contact form submissions in one place.

**Requirements**:

1. Add a protected route at `/admin/contacts` with a navigation entry labeled `Contacts`, following existing permission checks.
2. Display submissions in two tabs:
   - `Newsletter` tab shows all newsletter sign-ups.
   - `Contacts` tab shows all contact form messages.
3. Honor the shared admin layout; each tab uses a paginated, sortable shadcn + TanStack table.
4. Surface key attributes:
   - Newsletter: name, email, marketing acceptance, subscription status, submitted at.
   - Contact: name, email, subject, message (preview/expand), submitted at.
5. Provide global search plus per-tab filters (e.g., date ranges, subscription status, marketing acceptance).
6. Include `New Newsletter` and `New Contact` actions, opening forms for creation with required fields and validation.
7. Enable editing existing entries; pre-fill data, limit immutable fields (e.g., submission timestamp), and track last modifying admin.
8. Support soft deletes only; allow admins to mark entries inactive/archived with confirmation and audit trail.
9. Show inline validation, server error feedback, and disable submission until required fields pass validation.
10. Log destructive or critical actions (soft delete, status changes) with acting admin ID.

**Technical Requirements**:

- Reuse admin auth guards/middleware; unauthorized users receive 403.
- Extend admin APIs or server actions for listing, searching, filtering, creating, updating, and soft-deleting newsletter/contact submissions.
- Implement server-side pagination, filtering, and sorting for performance.
- Validate and sanitize all fields (email format, required fields, max lengths); enforce uniqueness constraints where applicable.
- Persist changes to the existing datastore with soft-delete flags; ensure referential integrity.
- Return structured validation errors for client handling.
- Prevent indexing of the contacts route by search engines if it can be publicly addressed.
- Create separate migrations for the newsletter submissions table and the contact submissions table (one migration per table).

**UI Requirements**:

- Follow the admin design system for tables, tabs, forms, buttons, alerts, and toasts.
- Keep tables responsive; ensure critical info remains visible on smaller screens.
- Provide CTA hierarchy: primary button for new entries, secondary row actions (e.g., edit, archive) via menus.
- Enable expanded views for longer contact messages (modal or row expansion).
- Surface success/error toasts summarizing actions.
- Ensure forms are accessible (labels, descriptions, focus management, keyboard navigation) and support cancel/back actions.

**Deliverables**:

- Admin contacts route with tabbed tables, filtering, and pagination for newsletter/contact submissions.
- Create/edit form components wired to admin APIs with validation, soft-delete flows, and feedback states.
- Navigation updates exposing `Contacts` only to authorized admins.
- Tests (unit/integration) covering server handlers, validation logic, and critical UI states.
- Documentation or handoff notes covering data schema, permissions, soft-delete behavior, and required environment configuration.
