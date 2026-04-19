import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email().optional(),
  password: z.string().trim().min(6).max(100)
});

export const loginSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  password: z.string().trim().min(6).max(100)
});
