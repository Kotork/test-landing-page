import { describe, expect, it, vi } from "vitest";

import {
  createNewsletterSubmission,
  updateContactSubmission,
  serializeContactsError,
} from "@/lib/contacts/service";
import { updateContactSchema } from "@/lib/contacts/schema";
import { HttpError } from "@/lib/utils/http-error";
import type { ContactSubmission, NewsletterSubmission } from "@/types";

function createSupabaseMock() {
  const insertedNewsletter: NewsletterSubmission = {
    id: "c0aafe33-3858-45d6-a89f-1da22c9b1c20",
    customer_id: null,
    email: "subscriber@example.com",
    name: "Taylor Swift",
    marketing_opt_in: true,
    subscription_status: "pending",
    submitted_at: new Date().toISOString(),
    confirmed_at: null,
    unsubscribed_at: null,
    bounce_reason: null,
    is_archived: false,
    archived_at: null,
    archived_by: null,
    archived_reason: null,
    created_by: "admin-1",
    updated_by: "admin-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existingContact: ContactSubmission = {
    id: "f7cb8b41-d2c8-4df1-9f91-8b0e86b4e7fb",
    customer_id: null,
    name: "Ada Lovelace",
    email: "ada@example.com",
    marketing_opt_in: false,
    subject: "Need a walkthrough",
    message: "Please call me back tomorrow morning.",
    metadata: null,
    status: "open",
    submitted_at: new Date().toISOString(),
    responded_at: null,
    last_follow_up_at: null,
    is_archived: false,
    archived_at: null,
    archived_by: null,
    archived_reason: null,
    created_by: "admin-1",
    updated_by: "admin-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let contactUpdatePayload: Record<string, unknown> | null = null;

  const newsletterTable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: insertedNewsletter,
          error: null,
        }),
      }),
    })),
  };

  const contactTable = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: existingContact,
          error: null,
        }),
      })),
    })),
    update: vi.fn((payload: Record<string, unknown>) => {
      contactUpdatePayload = payload;
      return {
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                ...existingContact,
                ...payload,
                updated_by: "admin-2",
              },
              error: null,
            }),
          })),
        })),
      };
    }),
  };

  const activityTable = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case "newsletter_submissions":
          return newsletterTable;
        case "contact_submissions":
          return contactTable;
        case "admin_activity_logs":
          return activityTable;
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    }),
  } as any;

  return {
    supabase,
    spies: {
      newsletterTable,
      contactTable,
      activityInsert: activityTable.insert,
    },
    insertedNewsletter,
    existingContact,
    getContactUpdatePayload: () => contactUpdatePayload,
  };
}

describe("contacts service", () => {
  it("creates a newsletter submission and logs activity", async () => {
    const { supabase, spies, insertedNewsletter } = createSupabaseMock();

    const result = await createNewsletterSubmission({
      supabase,
      payload: {
        email: "subscriber@example.com",
        name: "Taylor Swift",
        marketingOptIn: true,
        subscriptionStatus: "pending",
      },
      actingUserId: "admin-1",
    });

    expect(result.email).toBe(insertedNewsletter.email);
    expect(spies.activityInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_type: "newsletter_submission",
        action: "create",
      })
    );
  });

  it("archives a contact submission and records activity", async () => {
    const { supabase, spies, existingContact, getContactUpdatePayload } =
      createSupabaseMock();

    const result = await updateContactSubmission({
      supabase,
      payload: {
        id: existingContact.id,
        name: existingContact.name ?? "",
        email: existingContact.email,
        subject: existingContact.subject ?? "",
        message: existingContact.message,
        marketingOptIn: existingContact.marketing_opt_in,
        status: existingContact.status,
        archive: true,
        archiveReason: "No longer relevant",
      },
      actingUserId: "admin-2",
    });

    expect(result.is_archived).toBe(true);
    expect(getContactUpdatePayload()).toMatchObject({
      is_archived: true,
      archived_reason: "No longer relevant",
    });
    expect(spies.activityInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        resource_type: "contact_submission",
        action: "archive",
      })
    );
  });
});

describe("serializeContactsError", () => {
  it("serialises zod errors", () => {
    const error = updateContactSchema.safeParse({
      id: "1",
      email: "bad",
    } as any);
    if (error.success) {
      throw new Error("Expected validation error");
    }
    const result = serializeContactsError(error.error);
    expect(result.status).toBe(422);
  });

  it("serialises HttpError instances", () => {
    const httpError = new HttpError({
      status: 400,
      message: "Bad request",
    });
    const result = serializeContactsError(httpError);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("Bad request");
  });
});

