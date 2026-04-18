import { z } from "zod";

const createProgressPhotoValidationSchema = z.object({
  body: z.object({
    description: z.string({ required_error: "Description is required" }),
    url: z.string({ required_error: "Photo URL is required" }),
    propertyId: z.string({ required_error: "Property ID is required" }),
  }),
});

export const ProgressPhotoValidation = {
  createProgressPhotoValidationSchema,
};
