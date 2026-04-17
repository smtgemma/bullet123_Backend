import { z } from "zod";

const createTaskValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Task title is required" }),
    description: z.string().optional(),
    dueDate: z.string({ required_error: "Due date is required" }), // Will be parsed as Date
    assigneeId: z.string({ required_error: "Assignee ID is required" }),
    propertyId: z.string({ required_error: "Property ID is required" }),
  }),
});

const updateTaskStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"], { required_error: "Status is required" }),
  }),
});

export const TaskValidation = {
  createTaskValidationSchema,
  updateTaskStatusValidationSchema,
};
