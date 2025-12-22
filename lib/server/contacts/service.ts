import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { HttpError } from "@/lib/utils/http-error";
import type {
  NewsletterSubmission,
  ContactSubmission,
} from "@/types";
import {
  contactQuerySchema,
  createContactSchema,
  createNewsletterSchema,
  newsletterQuerySchema,
  updateContactSchema,
  updateNewsletterSchema,
  type ContactQueryInput,
  type CreateContactInput,
  type CreateNewsletterInput,
  type NewsletterQueryInput,
  type UpdateContactInput,
  type UpdateNewsletterInput,
} from "./schema";

type AdminClient = SupabaseClient;

type ListNewsletterArgs = {
  supabase: SupabaseClient;
  query: Partial<NewsletterQueryInput>;
};

type ListContactArgs = {
  supabase: SupabaseClient;
  query: Partial<ContactQueryInput>;
};

type CreateNewsletterArgs = {
  supabase: SupabaseClient;
  payload: CreateNewsletterInput;
  actingUserId: string;
};

type UpdateNewsletterArgs = {
  supabase: SupabaseClient;
  payload: UpdateNewsletterInput;
  actingUserId: string;
};

type CreateContactArgs = {
  supabase: SupabaseClient;
  payload: CreateContactInput;
  actingUserId: string;
};

type UpdateContactArgs = {
  supabase: SupabaseClient;
  payload: UpdateContactInput;
  actingUserId: string;
};

async function logAdminActivity(
  supabase: SupabaseClient,
  entry: {
    resourceType: string;
    resourceId: string;
    action: string;
    details?: Record<string, unknown>;
    actedBy: string;
  }
) {
  const { error } = await supabase.from("admin_activity_logs").insert({
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    action: entry.action,
    details: entry.details ?? null,
    acted_by: entry.actedBy,
  });

  if (error) {
    console.error("[admin_activity_logs] failed to insert entry", error);
  }
}

function applyNewsletterFilters(
  builder: any,
  filters: z.infer<typeof newsletterQuerySchema>
) {
  if (filters.search) {
    const term = `%${filters.search}%`;
    builder = builder.or(`email.ilike.${term},name.ilike.${term}`);
  }
  if (filters.status) {
    builder = builder.eq("subscription_status", filters.status);
  }
  if (typeof filters.marketingOptIn === "boolean") {
    builder = builder.eq("marketing_opt_in", filters.marketingOptIn);
  }
  if (filters.startDate) {
    builder = builder.gte("submitted_at", filters.startDate);
  }
  if (filters.endDate) {
    builder = builder.lte("submitted_at", filters.endDate);
  }
  if (!filters.includeArchived) {
    builder = builder.eq("is_archived", false);
  }
  return builder;
}

function applyContactFilters(
  builder: any,
  filters: z.infer<typeof contactQuerySchema>
) {
  if (filters.search) {
    const term = `%${filters.search}%`;
    builder = builder.or(
      `email.ilike.${term},name.ilike.${term},subject.ilike.${term},message.ilike.${term}`
    );
  }
  if (filters.status) {
    builder = builder.eq("status", filters.status);
  }
  if (typeof filters.marketingOptIn === "boolean") {
    builder = builder.eq("marketing_opt_in", filters.marketingOptIn);
  }
  if (filters.startDate) {
    builder = builder.gte("submitted_at", filters.startDate);
  }
  if (filters.endDate) {
    builder = builder.lte("submitted_at", filters.endDate);
  }
  if (!filters.includeArchived) {
    builder = builder.eq("is_archived", false);
  }
  return builder;
}

export async function listNewsletterSubmissions({
  supabase,
  query,
}: ListNewsletterArgs) {
  const filters = newsletterQuerySchema.parse(query);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let builder = supabase
    .from("newsletter_submissions")
    .select("*", { count: "exact" });

  builder = applyNewsletterFilters(builder, filters);

  const { data, error, count } = await builder
    .order(filters.sortBy, {
      ascending: filters.sortDir === "asc",
      nullsFirst: filters.sortBy === "name",
    })
    .range(from, to);
  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load newsletter submissions",
      payload: { reason: error.message },
    });
  }

  return {
    submissions: (data ?? []) as NewsletterSubmission[],
    total: count ?? data?.length ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function listContactSubmissions({
  supabase,
  query,
}: ListContactArgs) {
  const filters = contactQuerySchema.parse(query);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let builder = supabase
    .from("contact_submissions")
    .select("*", { count: "exact" });

  builder = applyContactFilters(builder, filters);

  const { data, error, count } = await builder
    .order(filters.sortBy, {
      ascending: filters.sortDir === "asc",
      nullsFirst: false,
    })
    .range(from, to);
  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load contact submissions",
      payload: { reason: error.message },
    });
  }

  return {
    submissions: (data ?? []) as ContactSubmission[],
    total: count ?? data?.length ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function createNewsletterSubmission({
  supabase,
  payload,
  actingUserId,
}: CreateNewsletterArgs) {
  const input = createNewsletterSchema.parse(payload);

  let duplicateQuery = supabase
    .from("newsletter_submissions")
    .select("id")
    .eq("email", input.email);

  if (input.organizationId) {
    duplicateQuery = duplicateQuery.eq("organization_id", input.organizationId);
  } else {
    duplicateQuery = duplicateQuery.is("organization_id", null);
  }

  duplicateQuery = duplicateQuery.eq("is_archived", false);

  const { data: existing } = await duplicateQuery.maybeSingle();
  if (existing) {
    throw new HttpError({
      status: 409,
      message: "Email already subscribed",
      payload: {
        fieldErrors: {
          email: [
            "This email address already has an active subscription for the selected organization.",
          ],
        },
      },
    });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("newsletter_submissions")
    .insert({
      organization_id: input.organizationId ?? null,
      email: input.email,
      name: input.name?.trim() ? input.name.trim() : null,
      marketing_opt_in: input.marketingOptIn,
      subscription_status: input.subscriptionStatus,
      submitted_at: input.submittedAt ?? now,
      confirmed_at: input.confirmedAt ?? null,
      unsubscribed_at: input.unsubscribedAt ?? null,
      bounce_reason: input.bounceReason?.trim() || null,
      created_by: actingUserId,
      updated_by: actingUserId,
    })
    .select("*")
    .single<NewsletterSubmission>();

  if (error || !data) {
    throw new HttpError({
      status: 500,
      message: "Failed to create newsletter submission",
      payload: { reason: error?.message },
    });
  }

  await logAdminActivity(supabase, {
    resourceType: "newsletter_submission",
    resourceId: data.id,
    action: "create",
    details: {
      subscription_status: data.subscription_status,
      marketing_opt_in: data.marketing_opt_in,
    },
    actedBy: actingUserId,
  });

  return data;
}

export async function updateNewsletterSubmission({
  supabase,
  payload,
  actingUserId,
}: UpdateNewsletterArgs) {
  const input = updateNewsletterSchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("newsletter_submissions")
    .select("*")
    .eq("id", input.id)
    .single<NewsletterSubmission>();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "Newsletter submission not found" });
  }

  if (input.email !== existing.email || input.organizationId !== existing.organization_id) {
    let duplicateQuery = supabase
      .from("newsletter_submissions")
      .select("id")
      .eq("email", input.email);

    if (input.organizationId) {
      duplicateQuery = duplicateQuery.eq("organization_id", input.organizationId);
    } else {
      duplicateQuery = duplicateQuery.is("organization_id", null);
    }
    duplicateQuery = duplicateQuery.eq("is_archived", false).neq("id", input.id);

    const { data: duplicate } = await duplicateQuery.maybeSingle();
    if (duplicate) {
      throw new HttpError({
        status: 409,
        message: "Email already subscribed",
        payload: {
          fieldErrors: {
            email: [
              "Another active subscription exists for this email. Archive it before reassigning.",
            ],
          },
        },
      });
    }
  }

  const updates: Partial<NewsletterSubmission> & Record<string, unknown> = {
    organization_id: input.organizationId ?? null,
    email: input.email,
    name: input.name?.trim() ? input.name.trim() : null,
    marketing_opt_in: input.marketingOptIn,
    subscription_status: input.subscriptionStatus,
    confirmed_at: input.confirmedAt ?? null,
    unsubscribed_at: input.unsubscribedAt ?? null,
    bounce_reason: input.bounceReason?.trim() ? input.bounceReason.trim() : null,
    updated_by: actingUserId,
  };

  let action: string | null = null;

  if (input.archive === true && !existing.is_archived) {
    updates.is_archived = true;
    updates.archived_at = new Date().toISOString();
    updates.archived_by = actingUserId;
    updates.archived_reason = input.archiveReason?.trim()
      ? input.archiveReason.trim()
      : null;
    action = "archive";
  } else if (input.archive === false && existing.is_archived) {
    updates.is_archived = false;
    updates.archived_at = null;
    updates.archived_by = null;
    updates.archived_reason = null;
    action = "unarchive";
  } else if (existing.is_archived && input.archive === undefined) {
    // keep archived metadata
    updates.archived_at = existing.archived_at ?? null;
    updates.archived_by = existing.archived_by ?? null;
    updates.archived_reason = existing.archived_reason ?? null;
  }

  const { data: updated, error: updateError } = await supabase
    .from("newsletter_submissions")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single<NewsletterSubmission>();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update newsletter submission",
      payload: { reason: updateError?.message },
    });
  }

  await logAdminActivity(supabase, {
    resourceType: "newsletter_submission",
    resourceId: updated.id,
    action: action ?? "update",
    details: {
      subscription_status_changed:
        existing.subscription_status !== updated.subscription_status,
      marketing_opt_in_changed:
        existing.marketing_opt_in !== updated.marketing_opt_in,
      archived: updated.is_archived,
    },
    actedBy: actingUserId,
  });

  return updated;
}

export async function createContactSubmission({
  supabase,
  payload,
  actingUserId,
}: CreateContactArgs) {
  const input = createContactSchema.parse(payload);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("contact_submissions")
    .insert({
      organization_id: input.organizationId ?? null,
      name: input.name?.trim() ? input.name.trim() : null,
      email: input.email,
      marketing_opt_in: input.marketingOptIn,
      subject: input.subject.trim(),
      message: input.message.trim(),
      metadata: input.metadata ?? null,
      status: input.status,
      submitted_at: input.submittedAt ?? now,
      responded_at: input.respondedAt ?? null,
      last_follow_up_at: input.lastFollowUpAt ?? null,
      created_by: actingUserId,
      updated_by: actingUserId,
    })
    .select("*")
    .single<ContactSubmission>();

  if (error || !data) {
    throw new HttpError({
      status: 500,
      message: "Failed to create contact submission",
      payload: { reason: error?.message },
    });
  }

  await logAdminActivity(supabase, {
    resourceType: "contact_submission",
    resourceId: data.id,
    action: "create",
    details: {
      status: data.status,
      marketing_opt_in: data.marketing_opt_in,
    },
    actedBy: actingUserId,
  });

  return data;
}

export async function updateContactSubmission({
  supabase,
  payload,
  actingUserId,
}: UpdateContactArgs) {
  const input = updateContactSchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", input.id)
    .single<ContactSubmission>();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "Contact submission not found" });
  }

  const updates: Partial<ContactSubmission> & Record<string, unknown> = {
    organization_id: input.organizationId ?? null,
    name: input.name?.trim() ? input.name.trim() : null,
    email: input.email,
    marketing_opt_in: input.marketingOptIn,
    subject: input.subject.trim(),
    message: input.message.trim(),
    metadata: input.metadata ?? null,
    status: input.status,
    responded_at: input.respondedAt ?? null,
    last_follow_up_at: input.lastFollowUpAt ?? null,
    updated_by: actingUserId,
  };

  let action: string | null = null;

  if (input.archive === true && !existing.is_archived) {
    updates.is_archived = true;
    updates.archived_at = new Date().toISOString();
    updates.archived_by = actingUserId;
    updates.archived_reason = input.archiveReason?.trim()
      ? input.archiveReason.trim()
      : null;
    action = "archive";
  } else if (input.archive === false && existing.is_archived) {
    updates.is_archived = false;
    updates.archived_at = null;
    updates.archived_by = null;
    updates.archived_reason = null;
    action = "unarchive";
  } else if (existing.is_archived && input.archive === undefined) {
    updates.is_archived = existing.is_archived;
    updates.archived_at = existing.archived_at;
    updates.archived_by = existing.archived_by;
    updates.archived_reason = existing.archived_reason;
  }

  const { data: updated, error: updateError } = await supabase
    .from("contact_submissions")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single<ContactSubmission>();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update contact submission",
      payload: { reason: updateError?.message },
    });
  }

  await logAdminActivity(supabase, {
    resourceType: "contact_submission",
    resourceId: updated.id,
    action: action ?? "update",
    details: {
      status_changed: existing.status !== updated.status,
      archived: updated.is_archived,
    },
    actedBy: actingUserId,
  });

  return updated;
}

export function serializeContactsError(error: unknown) {
  if (error instanceof z.ZodError) {
    const flattened = error.flatten();
    return {
      status: 422,
      body: {
        error: "Validation failed",
        fieldErrors: flattened.fieldErrors,
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


