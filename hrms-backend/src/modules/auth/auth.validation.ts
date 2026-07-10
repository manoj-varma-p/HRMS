import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
  }),
});

export const adminResetPasswordSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});
