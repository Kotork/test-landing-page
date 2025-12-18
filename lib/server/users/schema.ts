import { z } from "zod";

export const userStatusEnum = z.enum(["pending", "active", "disabled"]);
export const userRoleEnum = z.enum(["staff", "user"]);

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(120).optional(),
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
  isLocked: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true")
    .optional(),
  sortBy: z
    .enum([
      "full_name",
      "email",
      "role",
      "status",
      "last_login_at",
      "created_at",
    ])
    .default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Password must include a mix of uppercase, lowercase, and numbers"
  );

export const baseUserPayloadSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be under 120 characters"),
  email: z.string().email("Enter a valid email address").max(255),
  role: userRoleEnum,
  status: userStatusEnum,
  isLocked: z.boolean().default(false),
  passwordResetRequired: z.boolean().default(false),
  onboardingNote: z
    .string()
    .max(2000, "Onboarding note is too long")
    .optional()
    .or(z.literal("")),
  disabledReason: z
    .string()
    .max(500, "Disabled reason must be under 500 characters")
    .optional()
    .or(z.literal("")),
  sendOnboardingEmail: z.boolean().default(false),
});

export const createUserSchema = baseUserPayloadSchema
  .extend({
    password: z
      .union([passwordSchema, z.literal(""), z.undefined()])
      .default("")
      .transform((value) => {
        const trimmed = value?.trim?.() ?? "";
        return trimmed.length > 0 ? trimmed : undefined;
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.password && !data.sendOnboardingEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message:
          "Provide a password or enable onboarding email to send a set-password link.",
      });
    }
  });

export const updateUserSchema = baseUserPayloadSchema.extend({
  id: z.string().uuid(),
  password: z
    .union([passwordSchema, z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const trimmed = typeof value === "string" ? value.trim() : null;
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    }),
  confirmDestructive: z.boolean().optional(),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
