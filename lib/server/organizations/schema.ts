import { z } from "zod";

const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

const subdomainSchema = z
  .string()
  .min(1, "Subdomain is required")
  .max(100, "Subdomain must be under 100 characters")
  .regex(
    /^[a-z0-9-]+$/,
    "Subdomain can only contain lowercase letters, numbers, and hyphens"
  );

export const organizationBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters"),
  subdomain: subdomainSchema,
  logo_url: z
    .union([
      z
        .string()
        .url("Enter a valid URL")
        .max(500, "Logo URL must be under 500 characters"),
      z.literal(""),
    ])
    .optional(),
});

export const createOrganizationSchema = organizationBaseSchema;

export const updateOrganizationSchema = organizationBaseSchema.extend({
  id: z.string().uuid(),
});

export const organizationQuerySchema = paginationParams.extend({
  sortBy: z
    .enum(["name", "subdomain", "created_at", "updated_at"])
    .default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationQueryInput = z.infer<typeof organizationQuerySchema>;
