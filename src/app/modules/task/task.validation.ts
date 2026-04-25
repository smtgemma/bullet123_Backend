import { z } from "zod";

const createTaskValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Task title is required" }),
    description: z.string().optional(),
    dueDate: z.string({ required_error: "Due date is required" }), // Will be parsed as Date
    assigneeIds: z.array(z.string({ required_error: "Assignee IDs are required" })),
    propertyId: z.string({ required_error: "Property ID is required" }),
    link: z.string().optional(),
  }),
});

const updateTaskStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"], { required_error: "Status is required" }),
  }),
});

const addAssigneesValidationSchema = z.object({
  body: z.object({
    assigneeIds: z.array(z.string({ required_error: "Assignee IDs are required" })),
  }),
});

const updateTaskValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    link: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  }),
});

export const TaskValidation = {
  createTaskValidationSchema,
  updateTaskStatusValidationSchema,
  addAssigneesValidationSchema,
  updateTaskValidationSchema,
};
