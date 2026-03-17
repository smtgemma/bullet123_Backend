import { z } from "zod";

export const meetingSchema = z.object({
    body: z.object({
        name: z.string(),
        email: z.string().email(),
    }),
});
