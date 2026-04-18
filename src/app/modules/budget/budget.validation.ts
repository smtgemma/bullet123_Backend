import { z } from "zod";

const createBudgetValidationSchema = z.object({
  body: z.object({
    description: z.string({ required_error: "Description is required" }),
    budgetedAmount: z.number({ required_error: "Budgeted amount is required" }),
    completedAmount: z.number().optional(),
    propertyId: z.string({ required_error: "Property ID is required" }),
  }),
});

const updateBudgetValidationSchema = z.object({
  body: z.object({
    description: z.string().optional(),
    budgetedAmount: z.number().optional(),
    completedAmount: z.number().optional(),
  }),
});

export const BudgetValidation = {
  createBudgetValidationSchema,
  updateBudgetValidationSchema,
};
