import { z } from "zod";

export const createMasterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.string().email().optional(),
  password: z.string().trim().min(6).max(100)
});

/** Профиль текущего пользователя: имя, контакты, опционально смена пароля */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  /** Пустая строка — не менять пароль */
  newPassword: z.union([z.literal(""), z.string().trim().min(6).max(100)]).optional()
});
