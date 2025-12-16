import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If there's a database error (not just "no rows found"), log it
  if (userError && userError.code !== "PGRST116") {
    console.error("[getCurrentUser] Database error:", userError);
    return null;
  }

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

