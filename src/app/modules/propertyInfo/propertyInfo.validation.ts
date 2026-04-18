import { z } from "zod";

const createPropertyInfoValidationSchema = z.object({
  body: z.object({
    propertyAddress: z.string({ required_error: "Property address is required" }),
    parcelId: z.number({ required_error: "Parcel ID is required" }),
    zone: z.string({ required_error: "Zone is required" }),
    propertyType: z.string({ required_error: "Property type is required" }),
    vacancyStatus: z.string({ required_error: "Vacancy status is required" }),
    description: z.string().optional(),
    askingPrice: z.number({ required_error: "Asking price is required" }),
    disposition: z.string({ required_error: "Disposition is required" }),
    images: z.array(z.string()).optional(),
    assignedStaffIds: z.array(z.string()).optional(),
  }),
});

const updatePropertyInfoValidationSchema = z.object({
  body: z.object({
    propertyAddress: z.string().optional(),
    parcelId: z.number().optional(),
    zone: z.string().optional(),
    propertyType: z.string().optional(),
    vacancyStatus: z.string().optional(),
    description: z.string().optional(),
    askingPrice: z.number().optional(),
    disposition: z.string().optional(),
    images: z.array(z.string()).optional(),
    assignedStaffIds: z.array(z.string()).optional(),
  }),
});

const assignStaffValidationSchema = z.object({
  body: z.object({
    staffIds: z.array(z.string({ required_error: "Staff IDs are required" })),
  }),
});

export const PropertyInfoValidation = {
  createPropertyInfoValidationSchema,
  updatePropertyInfoValidationSchema,
  assignStaffValidationSchema,
};
