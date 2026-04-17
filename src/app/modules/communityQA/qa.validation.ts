import { z } from "zod";

const createQuestionSchema = z.object({
  title: z.string({ required_error: "Question title is required" }).min(10, "Title must be at least 10 characters"),
  details: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const postAnswerSchema = z.object({
  content: z.string({ required_error: "Answer content is required" }).min(10, "Answer must be at least 10 characters"),
});

export const QAValidation = {
  createQuestionSchema,
  postAnswerSchema,
};
