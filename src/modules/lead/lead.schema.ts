import { z } from "zod";

export const createLeadSchema = z
  .object({
    source: z.string().trim().min(1).max(100).default("webform"),
    utmSource: z.string().trim().max(191).optional(),
    utmMedium: z.string().trim().max(191).optional(),
    utmCampaign: z.string().trim().max(191).optional(),

    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().min(5).max(40),
    message: z.string().trim().max(140).optional(),

    companyName: z.string().trim().min(1).max(255),
    country: z.string().trim().min(1).max(120),
    businessType: z.string().trim().min(1).max(120),
    numberOfStaff: z.string().trim().min(1).max(120),
    acceptPrivacyPolicy: z.literal(true, {
      errorMap: () => ({
        message: "Privacy policy must be accepted",
      }),
    }),

    turnstileToken: z.string().trim().min(1).max(2_048),
    startedAt: z.coerce.number().int().positive(),
    hp: z.string().max(255).optional(),
  });

export const leadIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
