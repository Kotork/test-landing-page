import { z } from "zod";

export const newsletterStatusEnum = z.enum([
  "pending",
  "subscribed",
  "unsubscribed",
  "bounced",
]);

export const contactStatusEnum = z.enum([
  "new",
  "open",
  "in_progress",
  "resolved",
  "archived",
]);

const booleanParam = z
  .union([z.literal("true"), z.literal("false")])
  .transform((value) => value === "true");

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
  .transform((value) => new Date(value).toISOString())
  .optional();

export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const newsletterQuerySchema = paginationParams.extend({
  status: newsletterStatusEnum.optional(),
  marketingOptIn: booleanParam.optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  includeArchived: booleanParam.optional(),
  sortBy: z
    .enum([
      "submitted_at",
      "email",
      "subscription_status",
      "marketing_opt_in",
      "created_at",
    ])
    .default("submitted_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const contactQuerySchema = paginationParams.extend({
  status: contactStatusEnum.optional(),
  marketingOptIn: booleanParam.optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  includeArchived: booleanParam.optional(),
  sortBy: z
    .enum(["submitted_at", "email", "status", "created_at"])
    .default("submitted_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const newsletterBaseSchema = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  email: z
    .string()
    .min(3, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character")
    .max(120, "Name must be under 120 characters")
    .optional()
    .or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
  subscriptionStatus: newsletterStatusEnum,
  confirmedAt: z.string().datetime().optional().nullable(),
  unsubscribedAt: z.string().datetime().optional().nullable(),
  bounceReason: z
    .string()
    .max(400, "Bounce reason is too long")
    .optional()
    .or(z.literal("")),
  archiveReason: z
    .string()
    .max(400, "Archive reason must be under 400 characters")
    .optional()
    .or(z.literal("")),
  archive: z.boolean().optional(),
});

export const createNewsletterSchema = newsletterBaseSchema.omit({
  archiveReason: true,
  archive: true,
}).extend({
  submittedAt: z.string().datetime().optional(),
});

export const updateNewsletterSchema = newsletterBaseSchema.extend({
  id: z.string().uuid(),
  archiveReason: z
    .string()
    .max(400, "Archive reason must be under 400 characters")
    .optional()
    .or(z.literal("")),
  archive: z.boolean().optional(),
});

export const contactBaseSchema = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name must be at least 1 character")
    .max(120, "Name must be under 120 characters")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Enter a valid email address")
    .max(255),
  marketingOptIn: z.boolean().default(false),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(180, "Subject must be under 180 characters"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message must be under 5000 characters"),
  metadata: z.record(z.any()).optional(),
  status: contactStatusEnum.default("new"),
  respondedAt: z.string().datetime().optional().nullable(),
  lastFollowUpAt: z.string().datetime().optional().nullable(),
  archiveReason: z
    .string()
    .max(400, "Archive reason must be under 400 characters")
    .optional()
    .or(z.literal("")),
  archive: z.boolean().optional(),
});

export const createContactSchema = contactBaseSchema
  .omit({
    archiveReason: true,
    archive: true,
  })
  .extend({
    submittedAt: z.string().datetime().optional(),
  });

export const updateContactSchema = contactBaseSchema.extend({
  id: z.string().uuid(),
  archiveReason: z
    .string()
    .max(400, "Archive reason must be under 400 characters")
    .optional()
    .or(z.literal("")),
  archive: z.boolean().optional(),
});

export type NewsletterQueryInput = z.infer<typeof newsletterQuerySchema>;
export type ContactQueryInput = z.infer<typeof contactQuerySchema>;
export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

