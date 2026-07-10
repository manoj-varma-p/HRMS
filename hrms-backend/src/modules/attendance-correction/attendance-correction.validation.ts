import { z } from "zod";
import { CORRECTION_STATUS } from "./attendance-correction.model";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const requestCorrectionSchema = z.object({
  body: z
    .object({
      date: dateString,
      requestedCheckIn: z.coerce.date().optional(),
      requestedCheckOut: z.coerce.date().optional(),
      reason: z.string().trim().min(5, "Please describe the issue (at least 5 characters)"),
    })
    .refine((data) => data.requestedCheckIn || data.requestedCheckOut, {
      message: "Provide a requested check-in and/or check-out time",
      path: ["requestedCheckIn"],
    }),
});

export const listCorrectionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(Object.values(CORRECTION_STATUS) as [string, ...string[]]).optional(),
  }),
});

export const reviewCorrectionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    comment: z.string().trim().max(500).optional(),
  }),
});
