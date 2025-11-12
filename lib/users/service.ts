import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { HttpError } from "@/lib/utils/http-error";
import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserQueryInput,
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "./schema";
import type { User } from "@/types";

type AdminClient = SupabaseClient;

type UserRow = User;

type ListUsersArgs = {
  supabase: SupabaseClient;
  adminClient?: AdminClient;
  query: Partial<UserQueryInput>;
};

type CreateUserArgs = {
  supabase: SupabaseClient;
  adminClient?: AdminClient;
  payload: CreateUserInput;
  actingUserId: string;
};

type UpdateUserArgs = {
  supabase: SupabaseClient;
  adminClient?: AdminClient;
  payload: UpdateUserInput;
  actingUserId: string;
};

async function fetchLastLogin(
  adminClient: AdminClient | undefined,
  userId: string
) {
  if (!adminClient) return null;
  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error) {
      console.error("[admin:getUserById] failed", error.message);
      return null;
    }
    return data?.user?.last_sign_in_at ?? null;
  } catch (error) {
    console.error("[admin:getUserById] unexpected error", error);
    return null;
  }
}

async function logUserAudit(
  supabase: SupabaseClient,
  entry: {
    userId: string;
    actedBy: string;
    action: string;
    details?: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("user_audit_logs").insert({
    user_id: entry.userId,
    acted_by: entry.actedBy,
    action: entry.action,
    details: entry.details ?? null,
  });

  if (error) {
    console.error("[user_audit_logs] failed to insert entry", error);
  }
}

export async function listUsers({
  supabase,
  adminClient,
  query,
}: ListUsersArgs) {
  const filters = userQuerySchema.parse(query);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let builder = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order(filters.sortBy, {
      ascending: filters.sortDir === "asc",
      nullsFirst: filters.sortBy === "full_name",
    })
    .range(from, to);

  if (filters.search) {
    const term = `%${filters.search}%`;
    builder = builder.or(
      `email.ilike.${term},full_name.ilike.${term},id.ilike.${term}`
    );
  }
  if (filters.role) {
    builder = builder.eq("role", filters.role);
  }
  if (filters.status) {
    builder = builder.eq("status", filters.status);
  }
  if (typeof filters.isLocked === "boolean") {
    builder = builder.eq("is_locked", filters.isLocked);
  }

  const { data, error, count } = await builder;
  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load users",
      payload: {
        reason: error.message,
      },
    });
  }

  const results = data ?? [];

  const lastLoginMap = new Map<string, string | null>();
  if (adminClient) {
    await Promise.all(
      results.map(async (user) => {
        const lastLogin = await fetchLastLogin(adminClient, user.id);
        if (lastLogin) {
          lastLoginMap.set(user.id, lastLogin);
        }
      })
    );
  }

  const usersWithAuth = results.map((user) => ({
    ...user,
    last_login_at: lastLoginMap.get(user.id) ?? user.last_login_at ?? null,
  }));

  return {
    users: usersWithAuth,
    total: count ?? usersWithAuth.length,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function createUser({
  supabase,
  adminClient,
  payload,
  actingUserId,
}: CreateUserArgs) {
  const input = createUserSchema.parse(payload);

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();

  if (existing) {
    throw new HttpError({
      status: 409,
      message: "Email address already in use",
      payload: {
        fieldErrors: {
          email: ["This email address is already associated with an account."],
        },
      },
    });
  }

  if (!adminClient) {
    throw new HttpError({
      status: 500,
      message: "Supabase admin client not configured. Cannot create accounts.",
    });
  }

  const metadata = {
    full_name: input.fullName,
    role: input.role,
  };

  let authUserId: string | undefined;

  if (input.sendOnboardingEmail) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      input.email,
      {
        data: metadata,
      }
    );
    if (error) {
      throw new HttpError({
        status: 500,
        message: "Failed to send onboarding invitation",
        payload: {
          reason: error.message,
        },
      });
    }
    authUserId = data?.user?.id;
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: input.status === "active",
      user_metadata: metadata,
      app_metadata: { role: input.role },
    });
    if (error || !data) {
      throw new HttpError({
        status: 500,
        message: "Failed to create user",
        payload: {
          reason: error?.message ?? "Unknown error",
        },
      });
    }
    authUserId = data.user?.id;
  }

  if (!authUserId) {
    throw new HttpError({
      status: 500,
      message: "Supabase returned success without a user id. Cannot continue.",
    });
  }

  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({
      id: authUserId,
      email: input.email,
      role: input.role,
      full_name: input.fullName,
      status: input.status,
      is_locked: input.isLocked,
      locked_at: input.isLocked ? now : null,
      last_login_at: null,
      password_reset_required: input.passwordResetRequired,
      onboarding_note: input.onboardingNote?.length
        ? input.onboardingNote
        : null,
      disabled_reason: input.disabledReason?.length
        ? input.disabledReason
        : null,
      invited_at: input.sendOnboardingEmail ? now : null,
      created_by: actingUserId,
      updated_by: actingUserId,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new HttpError({
      status: 500,
      message: "Failed to persist user profile",
      payload: {
        reason: insertError?.message,
      },
    });
  }

  await logUserAudit(supabase, {
    userId: inserted.id,
    actedBy: actingUserId,
    action: "create",
    details: {
      role: input.role,
      status: input.status,
      sendOnboardingEmail: input.sendOnboardingEmail,
    },
  });

  return inserted;
}

export async function updateUser({
  supabase,
  adminClient,
  payload,
  actingUserId,
}: UpdateUserArgs) {
  const input = updateUserSchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", input.id)
    .single<UserRow>();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "User not found" });
  }

  if (input.email !== existing.email) {
    throw new HttpError({
      status: 400,
      message: "Email address cannot be changed once the account is created.",
      payload: {
        fieldErrors: { email: ["Email address is immutable."] },
      },
    });
  }

  const isStatusDisabled =
    input.status === "disabled" && existing.status !== "disabled";
  const isLocking = input.isLocked && !existing.is_locked;
  const isPasswordResetFlag =
    input.passwordResetRequired && !existing.password_reset_required;
  const isManualPassword = Boolean(input.password);

  const requiresConfirmation =
    isStatusDisabled || isLocking || isPasswordResetFlag || isManualPassword;

  if (requiresConfirmation && !input.confirmDestructive) {
    throw new HttpError({
      status: 400,
      message: "Confirm destructive changes before continuing.",
      payload: {
        fieldErrors: {
          confirmDestructive: [
            "Please acknowledge this change before submitting.",
          ],
        },
      },
    });
  }

  const updates: Partial<UserRow> = {
    full_name: input.fullName,
    role: input.role,
    status: input.status,
    is_locked: input.isLocked,
    password_reset_required: input.passwordResetRequired,
    onboarding_note: input.onboardingNote?.length ? input.onboardingNote : null,
    disabled_reason: input.disabledReason?.length ? input.disabledReason : null,
    updated_by: actingUserId,
  };

  let destructiveAction: string | null = null;
  const now = new Date().toISOString();

  if (input.isLocked !== existing.is_locked) {
    updates.locked_at = input.isLocked ? now : null;
    destructiveAction = input.isLocked ? "lock" : "unlock";
  }

  if (input.status !== existing.status && input.status === "disabled") {
    destructiveAction = "disable";
    if (!updates.disabled_reason) {
      updates.disabled_reason =
        existing.disabled_reason ??
        "Account disabled by administrator without a provided reason.";
    }
  } else if (input.status !== existing.status && input.status === "active") {
    updates.disabled_reason = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single<UserRow>();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update user",
      payload: {
        reason: updateError?.message,
      },
    });
  }

  if (adminClient) {
    const adminUpdates: Record<string, unknown> = {};
    if (input.password) {
      adminUpdates.password = input.password;
    }

    const userMetadataUpdates: Record<string, unknown> = {};
    if (input.fullName !== existing.full_name) {
      userMetadataUpdates.full_name = input.fullName;
    }
    if (Object.keys(userMetadataUpdates).length > 0) {
      adminUpdates.user_metadata = userMetadataUpdates;
    }

    if (input.role !== existing.role) {
      adminUpdates.app_metadata = { role: input.role };
    }

    if (Object.keys(adminUpdates).length > 0) {
      const { error: adminUpdateError } =
        await adminClient.auth.admin.updateUserById(input.id, adminUpdates);
      if (adminUpdateError) {
        throw new HttpError({
          status: 500,
          message: "Failed to update authentication profile",
          payload: {
            reason: adminUpdateError.message,
          },
        });
      }

      if (input.password) {
        destructiveAction = destructiveAction ?? "password_reset";
      }
    }
  }

  if (isPasswordResetFlag) {
    destructiveAction = destructiveAction ?? "require_password_reset";
  }

  if (adminClient && input.sendOnboardingEmail) {
    const { error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(existing.email, {
        data: { full_name: input.fullName, role: input.role },
      });
    if (inviteError) {
      throw new HttpError({
        status: 500,
        message: "Failed to resend onboarding email",
        payload: {
          reason: inviteError.message,
        },
      });
    }
  }

  await logUserAudit(supabase, {
    userId: input.id,
    actedBy: actingUserId,
    action: "update",
    details: {
      roleChanged: existing.role !== input.role,
      statusChanged: existing.status !== input.status,
      lockedChanged: existing.is_locked !== input.isLocked,
      destructiveAction,
    },
  });

  return updated;
}

export function serializeValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    return {
      status: 422,
      body: {
        error: "Validation failed",
        fieldErrors,
      },
    };
  }

  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        details: error.payload,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "Unexpected server error",
    },
  };
}
