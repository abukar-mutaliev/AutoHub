import { z } from "zod";

export const createOrderSchema = z.object({
  serviceId: z.string().min(1),
  carBrand: z.string().min(1),
  carModel: z.string().min(1),
  carYear: z.number().int().gte(1950).lte(new Date().getFullYear() + 1),
  comment: z.string().max(1000).optional(),
  address: z.string().max(255).optional(),
  scheduledAt: z.string().datetime().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["ASSIGNED", "EN_ROUTE", "IN_PROGRESS", "DONE", "CANCELLED"])
});

export const setFinalPriceSchema = z.object({
  finalPrice: z.number().positive()
});
