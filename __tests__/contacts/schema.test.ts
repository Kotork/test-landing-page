import { describe, expect, it } from "vitest";

import {
  createNewsletterSchema,
  createContactSchema,
  updateContactSchema,
  updateNewsletterSchema,
} from "@/lib/contacts/schema";

describe("createNewsletterSchema", () => {
  const basePayload = {
    email: "subscriber@example.com",
    name: "Taylor Swift",
    marketingOptIn: true,
    subscriptionStatus: "pending",
  };

  it("validates a minimal payload", () => {
    const result = createNewsletterSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    const result = createNewsletterSchema.safeParse({
      ...basePayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toContain("valid email");
    }
  });
});

describe("updateNewsletterSchema", () => {
  const basePayload = {
    id: "bfb1c6d2-4b7d-4d0e-9c88-86b80f35d111",
    email: "subscriber@example.com",
    name: "Taylor Swift",
    marketingOptIn: true,
    subscriptionStatus: "subscribed",
  };

  it("allows archiving with an optional note", () => {
    const result = updateNewsletterSchema.safeParse({
      ...basePayload,
      archive: true,
      archiveReason: "No longer engaged",
    });
    expect(result.success).toBe(true);
  });
});

describe("createContactSchema", () => {
  const basePayload = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Interested in a demo",
    message: "Hello! I'd like to see how the product works.",
    marketingOptIn: false,
  };

  it("accepts valid submissions", () => {
    const result = createContactSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
  });

  it("rejects empty messages", () => {
    const result = createContactSchema.safeParse({
      ...basePayload,
      message: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.message?.[0]).toContain("required");
    }
  });
});

describe("updateContactSchema", () => {
  const basePayload = {
    id: "e2afc619-3d2f-4b4b-9f65-ed26d9091b10",
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Interested in a demo",
    message: "Hello! I'd like to see how the product works.",
    marketingOptIn: false,
    status: "open",
  };

  it("allows archiving with a reason", () => {
    const result = updateContactSchema.safeParse({
      ...basePayload,
      archive: true,
      archiveReason: "Lead disqualified",
    });
    expect(result.success).toBe(true);
  });
});


