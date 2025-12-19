import * as z from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  subdomain: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
  logo_url: z
    .string()
    .url("Enter a valid URL")
    .max(500, "Logo URL must be under 500 characters")
    .optional(),
    
});
