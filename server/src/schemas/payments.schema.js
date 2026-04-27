import { z } from "zod";

export const paymentOrderSchema = z.object({
  orderId: z.string().min(1)
});
