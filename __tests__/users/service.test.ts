import { describe, expect, it, vi } from "vitest";

import {
  updateUser,
  serializeValidationError,
} from "@/lib/users/service";
import { createUserSchema } from "@/lib/users/schema";
import type { UpdateUserInput } from "@/lib/users/schema";

function createMockSupabase(existingUser: any, updatedUser: any) {
  const selectSingle = vi.fn().mockResolvedValue({
    data: existingUser,
    error: null,
  });
  const updateSingle = vi.fn().mockResolvedValue({
    data: updatedUser,
    error: null,
  });

  const usersTable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: selectSingle,
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: updateSingle,
        }),
      }),
    }),
  };

  const auditTable = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === "users") return usersTable;
    if (table === "user_audit_logs") return auditTable;
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: { from } as any,
    spies: {
      selectSingle,
      updateSingle,
      auditInsert: auditTable.insert,
    },
  };
}

function createMockAdminClient() {
  return {
    auth: {
      admin: {
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
        inviteUserByEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  } as any;
}

describe("updateUser", () => {
  const existingUser = {
    id: "d8ad9321-0754-4e14-8471-7fb59380cb58",
    email: "staff@example.com",
    role: "staff",
    status: "active",
    is_locked: false,
    password_reset_required: false,
    full_name: "Staff Member",
    onboarding_note: null,
    disabled_reason: null,
  };

  it("requires confirmation when disabling an account", async () => {
    const { supabase } = createMockSupabase(existingUser, existingUser);
    const adminClient = createMockAdminClient();

    const input: UpdateUserInput = {
      id: existingUser.id,
      email: existingUser.email,
      fullName: "Staff Member",
      role: "staff",
      status: "disabled",
      isLocked: false,
      passwordResetRequired: false,
      sendOnboardingEmail: false,
      password: "",
      onboardingNote: "",
      disabledReason: "",
      confirmDestructive: false,
    };

    await expect(
      updateUser({
        supabase,
        adminClient,
        payload: input,
        actingUserId: "acting-admin",
      })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("Confirm destructive"),
    });
  });

  it("updates user when confirmation is provided", async () => {
    const updatedUser = {
      ...existingUser,
      status: "disabled",
      disabled_reason: "Access revoked",
    };
    const { supabase, spies } = createMockSupabase(existingUser, updatedUser);
    const adminClient = createMockAdminClient();

    const input: UpdateUserInput = {
      id: existingUser.id,
      email: existingUser.email,
      fullName: "Staff Member",
      role: "staff",
      status: "disabled",
      isLocked: false,
      passwordResetRequired: false,
      sendOnboardingEmail: false,
      password: "",
      onboardingNote: "",
      disabledReason: "Access revoked",
      confirmDestructive: true,
    };

    const result = await updateUser({
      supabase,
      adminClient,
      payload: input,
      actingUserId: "acting-admin",
    });

    expect(result.status).toBe("disabled");
    expect(spies.auditInsert).toHaveBeenCalled();
  });
});

describe("serializeValidationError", () => {
  it("serializes zod errors", () => {
    const invalidPayload = {
      fullName: "Grace Hopper",
      email: "bad-email",
      role: "staff",
      status: "pending",
      isLocked: false,
      passwordResetRequired: false,
      sendOnboardingEmail: false,
      password: "",
      onboardingNote: "",
      disabledReason: "",
    };
    const parseResult = createUserSchema.safeParse(invalidPayload);

    if (parseResult.success) {
      throw new Error("Expected schema validation to fail");
    }

    const result = serializeValidationError(parseResult.error);

    expect(result.status).toBe(422);
    expect(result.body.fieldErrors.email[0]).toContain("valid email");
  });
});

