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

