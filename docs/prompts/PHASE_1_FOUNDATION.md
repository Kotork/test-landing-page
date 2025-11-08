# Phase 1: Foundation

## Objective

Set up the project foundation including Next.js 15, Supabase configuration, TailwindCSS, shadcn/ui, database schema, and authentication system.

## Prerequisites

- Next.js 15+ project already created (TypeScript, TailwindCSS, App Router)
- Node.js 18+ installed
- Supabase account and project created
- Basic understanding of Next.js App Router
- Use ppnpm

## Implementation Steps

### 1. Verify Project Setup

**Check existing configuration:**

- Verify `package.json` exists and has Next.js 15+
- Verify TypeScript is configured (`tsconfig.json`)
- Verify TailwindCSS is set up (`tailwind.config.js`)
- Verify App Router structure (`app/` directory exists)
- Verify import alias `@/*` is configured in `tsconfig.json`

**If any of the above are missing, set them up first.**

### 2. Install Required Dependencies

**Check if dependencies are already installed, then install missing ones:**

```bash
# Core Supabase packages
pnpm install @supabase/supabase-js @supabase/ssr

# Drag and drop
pnpm install @dnd-kit/core @dnd-kit/sortable

# Form handling
pnpm install react-hook-form zod @hookform/resolvers

# UI utilities (for shadcn/ui)
pnpm install lucide-react
pnpm install class-variance-authority clsx tailwind-merge

# Radix UI packages (installed automatically by shadcn/ui, but listed for reference)
# @radix-ui/react-dialog
# @radix-ui/react-dropdown-menu
# @radix-ui/react-label
# etc.
```

**Note:** If some packages are already installed, pnpm will skip them.

### 3. Set Up shadcn/ui (if not already configured)

**Check if shadcn/ui is already configured:**

- Look for `components.json` file in root
- Check if `components/ui/` directory exists

**If not configured, run:**

```bash
npx shadcn@latest init
```

**Configuration:**

- Style: Default
- Base color: Slate
- CSS variables: Yes

**Install required components (if not already installed):**

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
```

**Note:** If components already exist, shadcn will prompt to overwrite or skip.

### 4. Configure Supabase

**Check if `.env.local` already exists:**

- If it exists, verify it has Supabase credentials
- If it doesn't exist, create it

**Create or update `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Check if `lib/supabase/` directory exists, create if needed.**

**Create or update `lib/supabase/client.ts`:**

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Create or update `lib/supabase/server.ts`:**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
```

**Create or update `lib/supabase/middleware.ts`:**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

### 5. Create Database Schema

**Check if `supabase/migrations/` directory exists, create if needed.**

**Create `supabase/migrations/001_initial_schema.sql`:**

Reference `01_DATABASE_SCHEMA.md` for complete schema. Create all tables:

- users
- customers
- landing_pages
- section_templates
- page_sections
- form_fields
- form_submissions
- contacts
- analytics_events
- custom_domains

**Run migration in Supabase Dashboard:**

1. Go to SQL Editor
2. Paste migration SQL
3. Execute

### 6. Set Up Authentication

**Check if `lib/utils/` directory exists, create if needed.**

**Create or update `lib/utils/auth.ts`:**

```typescript
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return userData;
}

export async function requireAuth(role?: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (role && user.role !== role) {
    throw new Error("Forbidden");
  }

  return user;
}
```

**Check if `app/api/auth/callback/` directory exists, create if needed.**

**Create or update `app/api/auth/callback/route.ts`:**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

### 7. Create Basic Auth Pages

**Check if `app/(auth)/` directory exists, create if needed.**

**Create or update `app/(auth)/login/page.tsx`:**

- Login form with email/password
- Redirect to dashboard based on role
- Use shadcn/ui form components

**Create or update `app/(auth)/signup/page.tsx`:**

- Signup form (if needed for staff)
- Link to login

### 8. Create Middleware

**Check if `middleware.ts` already exists in root directory.**

**Create or update `middleware.ts`:**

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 9. Set Up TypeScript Types

**Check if `types/` directory exists, create if needed.**

**Create or update `types/index.ts`:**

```typescript
export type UserRole = "staff" | "customer";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
```

**Generate Supabase types:**

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

### 10. Create Basic Layouts

**Check existing layouts and update or create as needed.**

**Update `app/layout.tsx`:**

- Root layout with metadata
- Include TailwindCSS
- Set up font loading

**Check if `app/(admin)/` directory exists, create if needed.**

**Create or update `app/(admin)/layout.tsx`:**

- Admin layout with sidebar navigation
- Protected route (require 'staff' role)

**Check if `app/(customer)/` directory exists, create if needed.**

**Create or update `app/(customer)/layout.tsx`:**

- Customer layout with sidebar navigation
- Protected route (require 'customer' role)

## Verification Checklist

- [ ] Project structure verified (Next.js 15+, TypeScript, TailwindCSS)
- [ ] All required dependencies installed
- [ ] shadcn/ui configured (or verified if already set up)
- [ ] Supabase client/server/middleware files created
- [ ] Environment variables set in `.env.local`
- [ ] Database schema created in Supabase
- [ ] All tables created successfully
- [ ] Authentication flow working
- [ ] Login page functional
- [ ] Middleware protecting routes
- [ ] TypeScript types generated
- [ ] Basic layouts created (root, admin, customer)

## Next Steps

After completing Phase 1, proceed to **Phase 2: Multi-Tenancy** to implement subdomain routing and customer management.

## Reference Documents

- `00_PROJECT_OVERVIEW.md` - Project overview
- `01_DATABASE_SCHEMA.md` - Complete database schema
- `02_PROJECT_STRUCTURE.md` - File structure
