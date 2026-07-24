import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const columnType = z.enum(["text", "date", "tags", "number"]);
const permission = z.enum(["view", "edit"]);

export const userIdParamSchema = z.object({
  params: z.object({ userId: objectId }),
});

export const grantAccessSchema = z.object({
  params: z.object({ userId: objectId }),
  body: z.object({ permission }),
});

export const updateSheetSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    columns: z
      .array(
        z.object({
          name: z.string().trim().max(200),
          type: columnType,
        })
      )
      .max(50)
      .optional(),
    rows: z.array(z.array(z.string().max(2000)).max(50)).max(5000).optional(),
  }),
});
