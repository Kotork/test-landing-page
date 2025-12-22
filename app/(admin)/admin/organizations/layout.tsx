import { requireAuth } from "@/lib/utils/auth";
import { redirect } from "next/navigation";

export default async function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect organizations route - require 'staff' role
  try {
    const user = await requireAuth("staff");

    // If user is not staff, redirect to dashboard
    if (!user || user.role !== "staff") {
      redirect("/admin/dashboard");
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        redirect("/login");
      }
      if (error.message === "Forbidden") {
        redirect("/admin/dashboard");
      }
    }
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}
