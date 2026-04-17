import { z } from "zod";

const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  profileVisibility: z.boolean().optional(),
  showContactInfo: z.boolean().optional(),
});

export const SettingsValidation = { updateSettingsSchema };
