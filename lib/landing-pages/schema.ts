import { z } from "zod";

const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug must be under 100 characters")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug can only contain lowercase letters, numbers, and hyphens"
  );

export const landingPageBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be under 200 characters"),
  slug: slugSchema,
  domain: z
    .string()
    .max(255, "Domain must be under 255 characters")
    .regex(
      /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      "Enter a valid domain name"
    )
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const createLandingPageSchema = landingPageBaseSchema;

export const updateLandingPageSchema = landingPageBaseSchema.extend({
  id: z.string().uuid(),
});

export const landingPageQuerySchema = paginationParams.extend({
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true")
    .optional(),
  sortBy: z
    .enum(["name", "slug", "created_at", "updated_at"])
    .default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const apiKeyBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const createApiKeySchema = apiKeyBaseSchema.extend({
  landingPageId: z.string().uuid(),
});

export const updateApiKeySchema = apiKeyBaseSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

// Public API schemas for external landing pages
export const newsletterSubmissionSchema = z.object({
  email: z.string().email("Enter a valid email address").max(255),
  name: z.string().max(120, "Name must be under 120 characters").optional(),
  marketingOptIn: z.boolean().default(false),
});

export const contactSubmissionSchema = z.object({
  name: z.string().max(120, "Name must be under 120 characters").optional(),
  email: z.string().email("Enter a valid email address").max(255),
  subject: z.string().max(180, "Subject must be under 180 characters"),
  message: z.string().max(5000, "Message must be under 5000 characters"),
  marketingOptIn: z.boolean().default(false),
});

export const customSubmissionSchema = z.object({
  data: z.record(z.any()),
  submissionType: z.enum(["newsletter", "contact", "analytics", "custom"]),
});

export type CreateLandingPageInput = z.infer<typeof createLandingPageSchema>;
export type UpdateLandingPageInput = z.infer<typeof updateLandingPageSchema>;
export type LandingPageQueryInput = z.infer<typeof landingPageQuerySchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
export type NewsletterSubmissionInput = z.infer<
  typeof newsletterSubmissionSchema
>;
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type CustomSubmissionInput = z.infer<typeof customSubmissionSchema>;
