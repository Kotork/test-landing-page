import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { HttpError } from "@/lib/utils/http-error";
import { generateApiKey, hashApiKey } from "@/lib/utils/api-key-generator";
import {
  createLandingPageSchema,
  updateLandingPageSchema,
  landingPageQuerySchema,
  createApiKeySchema,
  updateApiKeySchema,
  type CreateLandingPageInput,
  type UpdateLandingPageInput,
  type LandingPageQueryInput,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
} from "./schema";

type ListLandingPagesArgs = {
  supabase: SupabaseClient;
  organizationId: string;
  query: Partial<LandingPageQueryInput>;
};

type CreateLandingPageArgs = {
  supabase: SupabaseClient;
  payload: CreateLandingPageInput;
  organizationId: string;
  actingUserId: string;
};

type UpdateLandingPageArgs = {
  supabase: SupabaseClient;
  payload: UpdateLandingPageInput;
  actingUserId: string;
};

type CreateApiKeyArgs = {
  supabase: SupabaseClient;
  payload: CreateApiKeyInput;
  actingUserId: string;
};

type UpdateApiKeyArgs = {
  supabase: SupabaseClient;
  payload: UpdateApiKeyInput;
  actingUserId: string;
};

function applyLandingPageFilters(
  builder: ReturnType<SupabaseClient["from"]>,
  filters: z.infer<typeof landingPageQuerySchema>
) {
  if (filters.search) {
    const term = `%${filters.search}%`;
    builder = builder.or(`name.ilike.${term},slug.ilike.${term}`);
  }
  if (typeof filters.isActive === "boolean") {
    builder = builder.eq("is_active", filters.isActive);
  }
  return builder;
}

export async function listLandingPages({
  supabase,
  organizationId,
  query,
}: ListLandingPagesArgs) {
  const filters = landingPageQuerySchema.parse(query);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let builder = supabase
    .from("landing_pages")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order(filters.sortBy, {
      ascending: filters.sortDir === "asc",
    })
    .range(from, to);

  builder = applyLandingPageFilters(builder, filters);

  const { data, error, count } = await builder;
  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load landing pages",
      payload: { reason: error.message },
    });
  }

  return {
    landingPages: data ?? [],
    total: count ?? data?.length ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getLandingPage(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load landing page",
      payload: { reason: error.message },
    });
  }

  if (!data) {
    throw new HttpError({ status: 404, message: "Landing page not found" });
  }

  return data;
}

export async function createLandingPage({
  supabase,
  payload,
  organizationId,
  actingUserId,
}: CreateLandingPageArgs) {
  const input = createLandingPageSchema.parse(payload);

  // Check if slug already exists for this organization
  const { data: existing } = await supabase
    .from("landing_pages")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("slug", input.slug)
    .maybeSingle();

  if (existing) {
    throw new HttpError({
      status: 409,
      message: "Slug already exists",
      payload: {
        fieldErrors: {
          slug: ["This slug is already in use for your organization."],
        },
      },
    });
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      slug: input.slug.trim(),
      domain: input.domain?.trim() || null,
      is_active: input.isActive,
      created_by: actingUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new HttpError({
      status: 500,
      message: "Failed to create landing page",
      payload: { reason: error?.message },
    });
  }

  return data;
}

export async function updateLandingPage({
  supabase,
  payload,
  actingUserId,
}: UpdateLandingPageArgs) {
  const input = updateLandingPageSchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "Landing page not found" });
  }

  // Check if slug already exists for this organization (excluding current page)
  if (input.slug !== existing.slug) {
    const { data: duplicate } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("organization_id", existing.organization_id)
      .eq("slug", input.slug)
      .neq("id", input.id)
      .maybeSingle();

    if (duplicate) {
      throw new HttpError({
        status: 409,
        message: "Slug already exists",
        payload: {
          fieldErrors: {
            slug: ["This slug is already in use for your organization."],
          },
        },
      });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("landing_pages")
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      domain: input.domain?.trim() || null,
      is_active: input.isActive,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update landing page",
      payload: { reason: updateError?.message },
    });
  }

  return updated;
}

export async function deleteLandingPage(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("landing_pages").delete().eq("id", id);

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to delete landing page",
      payload: { reason: error.message },
    });
  }
}

export async function createApiKey({
  supabase,
  payload,
  actingUserId,
}: CreateApiKeyArgs) {
  const input = createApiKeySchema.parse(payload);

  // Verify landing page exists and belongs to user's organization
  const { data: landingPage } = await supabase
    .from("landing_pages")
    .select("id, organization_id")
    .eq("id", input.landingPageId)
    .maybeSingle();

  if (!landingPage) {
    throw new HttpError({ status: 404, message: "Landing page not found" });
  }

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      landing_page_id: input.landingPageId,
      key_hash: keyHash,
      name: input.name.trim(),
      expires_at: input.expiresAt || null,
      is_active: true,
      created_by: actingUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new HttpError({
      status: 500,
      message: "Failed to create API key",
      payload: { reason: error?.message },
    });
  }

  // Return the plain API key (only shown once)
  return {
    ...data,
    apiKey, // Include plain key only in creation response
  };
}

export async function listApiKeys(
  supabase: SupabaseClient,
  landingPageId: string
) {
  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, name, last_used_at, expires_at, is_active, created_at, created_by"
    )
    .eq("landing_page_id", landingPageId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load API keys",
      payload: { reason: error.message },
    });
  }

  return data ?? [];
}

export async function updateApiKey({
  supabase,
  payload,
  actingUserId,
}: UpdateApiKeyArgs) {
  const input = updateApiKeySchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("api_keys")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "API key not found" });
  }

  const updates: Record<string, unknown> = {
    name: input.name.trim(),
    expires_at: input.expiresAt || null,
  };

  if (typeof input.isActive === "boolean") {
    updates.is_active = input.isActive;
  }

  const { data: updated, error: updateError } = await supabase
    .from("api_keys")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update API key",
      payload: { reason: updateError?.message },
    });
  }

  return updated;
}

export async function deleteApiKey(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("api_keys").delete().eq("id", id);

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to delete API key",
      payload: { reason: error.message },
    });
  }
}

export function serializeLandingPageError(error: unknown) {
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
