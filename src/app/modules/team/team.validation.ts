import { z } from "zod";

const createTeamValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Team name is required" }),
    memberIds: z.array(z.string()).optional(),
  }),
});

const addMembersValidationSchema = z.object({
  body: z.object({
    memberIds: z.array(z.string(), { required_error: "Member IDs are required" }),
  }),
});

export const TeamValidation = {
  createTeamValidationSchema,
  addMembersValidationSchema,
};
