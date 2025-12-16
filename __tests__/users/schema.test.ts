import { describe, expect, it } from "vitest";

import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/users/schema";

describe("createUserSchema", () => {
  const basePayload = {
    fullName: "Grace Hopper",
    email: "grace@example.com",
    role: "staff",
    status: "pending",
    isLocked: false,
    passwordResetRequired: false,
    onboardingNote: "",
    disabledReason: "",
  };

  it("requires a password when onboarding email is disabled", () => {
    const result = createUserSchema.safeParse({
      ...basePayload,
      sendOnboardingEmail: false,
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toContain(
        "Provide a password"
      );
    }
  });

  it("accepts valid password when onboarding email is disabled", () => {
    const result = createUserSchema.safeParse({
      ...basePayload,
      sendOnboardingEmail: false,
      password: "StrongPass123",
    });

    expect(result.success).toBe(true);
  });

  it("accepts onboarding email flow without password", () => {
    const result = createUserSchema.safeParse({
      ...basePayload,
      sendOnboardingEmail: true,
      password: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateUserSchema", () => {
  const baseUpdate = {
    id: "0c1d2e3f-4455-6677-8899-aabbccddeeff",
    fullName: "Grace Hopper",
    email: "grace@example.com",
    role: "staff",
    status: "active",
    isLocked: false,
    passwordResetRequired: false,
    sendOnboardingEmail: false,
    password: "",
    onboardingNote: "",
    disabledReason: "",
    confirmDestructive: false,
  };

  it("allows safe profile updates without destructive confirmation", () => {
    const result = updateUserSchema.safeParse({
      ...baseUpdate,
      fullName: "Grace B. Hopper",
    });
    expect(result.success).toBe(true);
  });

  it("permits destructive changes once confirmed", () => {
    const result = updateUserSchema.safeParse({
      ...baseUpdate,
      status: "disabled",
      confirmDestructive: true,
    });
    expect(result.success).toBe(true);
  });
});


