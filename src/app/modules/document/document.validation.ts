import { z } from "zod";

const createDocumentValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Document name is required" }),
    type: z.string({ required_error: "Document type is required" }),
    fileUrl: z.string({ required_error: "File URL is required" }),
    fileSize: z.string().optional(),
    isSigningRequired: z.boolean().optional(),
    signatoryId: z.string().optional(),
    signatoryName: z.string().optional(),
    propertyId: z.string({ required_error: "Property ID is required" }),
  }),
});

const updateDocumentValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    isSigningRequired: z.boolean().optional(),
    signatoryId: z.string().optional(),
    signatoryName: z.string().optional(),
    signedAt: z.string().optional(),
  }),
});

export const DocumentValidation = {
  createDocumentValidationSchema,
  updateDocumentValidationSchema,
};
