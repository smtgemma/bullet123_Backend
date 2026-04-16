import { z } from "zod";

const updateMunicipalitySchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").optional(),
  }),
});

export const MunicipalityValidation = {
  updateMunicipalitySchema,
};
