import { z } from "zod";

const createProgressPhotoValidationSchema = z.object({
  body: z.object({
    propertyId: z.string({ required_error: "Property ID is required" }),
    urls: z.array(z.string({ required_error: "Photo URLs are required" })),
  }),
});

export const ProgressPhotoValidation = {
  createProgressPhotoValidationSchema,
};
