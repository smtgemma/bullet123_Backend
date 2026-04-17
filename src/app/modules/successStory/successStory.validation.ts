import { z } from "zod";
import { StoryCategory } from "@prisma/client";

const createSuccessStorySchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(5),
  category: z.nativeEnum(StoryCategory, { required_error: "Category is required" }),
  location: z.string({ required_error: "Location is required" }),
  completedDate: z.string({ required_error: "Completed date is required" }),
  beforeImage: z.string({ required_error: "Before image is required" }),
  afterImage: z.string({ required_error: "After image is required" }),
  investment: z.number({ required_error: "Investment amount is required" }).positive(),
  duration: z.number({ required_error: "Duration is required" }).int().positive(),
  roi: z.number({ required_error: "ROI is required" }).positive(),
  storyText: z.string({ required_error: "Story text is required" }).min(20),
  quote: z.string().optional(),
  quoteAuthor: z.string().optional(),
  quoteAuthorRole: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  teamMembers: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        profilePic: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

const updateSuccessStorySchema = createSuccessStorySchema.partial();

export const SuccessStoryValidation = {
  createSuccessStorySchema,
  updateSuccessStorySchema,
};
