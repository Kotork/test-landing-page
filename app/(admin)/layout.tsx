import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/utils/auth";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  UserCog,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect route - require 'staff' role
  type AuthenticatedUser = Awaited<ReturnType<typeof requireAuth>>;
  let user: AuthenticatedUser;
  try {
    user = await requireAuth("staff");

    console.log({ adminUser: user })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        redirect("/login");
      }
      if (error.message === "Forbidden") {
        redirect("/forbidden");
      }
    }
    throw error;
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: UserCog },
    { name: "Contacts", href: "/admin/contacts", icon: Mail },
    { name: "Organizations", href: "/admin/organizations", icon: Users },
    { name: "Landing Pages", href: "/admin/landing-pages", icon: FileText },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4">
            <div className="mb-2 px-3 text-sm text-muted-foreground">
              {user.email}
            </div>
            <form
              action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/login");
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

