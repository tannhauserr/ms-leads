import { z } from "zod";

export const createLeadSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    source: z.string().trim().min(1).max(100).default("webform"),
    utmSource: z.string().trim().max(191).optional(),
    utmMedium: z.string().trim().max(191).optional(),
    utmCampaign: z.string().trim().max(191).optional(),

    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(5).max(40),
    message: z.string().trim().max(4_000).optional(),

    companyName: z.string().trim().min(1).max(255),
    country: z.string().trim().min(1).max(120),
    businessType: z.string().trim().min(1).max(120),
    numberOfStaff: z.string().trim().min(1).max(120),

    hp: z.string().max(255).optional(),
  })
  .superRefine((input, context) => {
    if (input.hp && input.hp.trim().length > 0) {
      context.addIssue({
        code: "custom",
        path: ["hp"],
        message: "Honeypot field must be empty",
      });
    }
  });

export const leadIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
