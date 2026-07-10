import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(2, "Enter at least 2 characters"),
  }),
});
