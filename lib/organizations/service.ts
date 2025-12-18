import { HttpError } from "@/lib/utils/http-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createOrganizationSchema,
  organizationQuerySchema,
  updateOrganizationSchema,
  type CreateOrganizationInput,
  type OrganizationQueryInput,
  type UpdateOrganizationInput,
} from "./schema";

type ListOrganizationsArgs = {
  supabase: SupabaseClient;
  query: Partial<OrganizationQueryInput>;
};

type CreateOrganizationArgs = {
  supabase: SupabaseClient;
  payload: CreateOrganizationInput;
  actingUserId: string;
};

type UpdateOrganizationArgs = {
  supabase: SupabaseClient;
  payload: UpdateOrganizationInput;
  actingUserId: string;
};

export async function listOrganizations({
  supabase,
  query,
}: ListOrganizationsArgs) {
  const filters = organizationQuerySchema.parse(query);
  const from = (filters.page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let builder = supabase.from("organizations").select("*", { count: "exact" });

  if (filters.search) {
    const term = `%${filters.search}%`;
    builder = builder.or(`name.ilike.${term},subdomain.ilike.${term}`);
  }

  builder = builder
    .order(filters.sortBy, {
      ascending: filters.sortDir === "asc",
    })
    .range(from, to);

  const { data, error, count } = await builder;
  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load organizations",
      payload: { reason: error.message },
    });
  }

  return {
    organizations: data ?? [],
    total: count ?? data?.length ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getOrganization(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to load organization",
      payload: { reason: error.message },
    });
  }

  if (!data) {
    throw new HttpError({ status: 404, message: "Organization not found" });
  }

  return data;
}

export async function createOrganization({
  supabase,
  payload,
  actingUserId,
}: CreateOrganizationArgs) {
  const input = createOrganizationSchema.parse(payload);

  // Check if subdomain already exists
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("subdomain", input.subdomain)
    .maybeSingle();

  if (existing) {
    throw new HttpError({
      status: 409,
      message: "Subdomain already exists",
      payload: {
        fieldErrors: {
          subdomain: ["This subdomain is already in use."],
        },
      },
    });
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name.trim(),
      subdomain: input.subdomain.trim(),
      logo_url: input.logo_url?.trim() || null,
      created_by: actingUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new HttpError({
      status: 500,
      message: "Failed to create organization",
      payload: { reason: error?.message },
    });
  }

  return data;
}

export async function updateOrganization({
  supabase,
  payload,
}: UpdateOrganizationArgs) {
  const input = updateOrganizationSchema.parse(payload);

  const { data: existing, error: fetchError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new HttpError({ status: 404, message: "Organization not found" });
  }

  // Check if subdomain already exists (excluding current organization)
  if (input.subdomain !== existing.subdomain) {
    const { data: duplicate } = await supabase
      .from("organizations")
      .select("id")
      .eq("subdomain", input.subdomain)
      .neq("id", input.id)
      .maybeSingle();

    if (duplicate) {
      throw new HttpError({
        status: 409,
        message: "Subdomain already exists",
        payload: {
          fieldErrors: {
            subdomain: ["This subdomain is already in use."],
          },
        },
      });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("organizations")
    .update({
      name: input.name.trim(),
      subdomain: input.subdomain.trim(),
      logo_url: input.logo_url?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new HttpError({
      status: 500,
      message: "Failed to update organization",
      payload: { reason: updateError?.message },
    });
  }

  return updated;
}

export async function deleteOrganization(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("organizations").delete().eq("id", id);

  if (error) {
    throw new HttpError({
      status: 500,
      message: "Failed to delete organization",
      payload: { reason: error.message },
    });
  }
}

export function serializeOrganizationError(error: unknown) {
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
