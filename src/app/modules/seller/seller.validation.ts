import { z } from "zod";

const updateSellerSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    phoneNumber: z.string().optional(),
    website: z.string().optional(),
  }),
});

export const SellerValidation = {
  updateSellerSchema,
};
