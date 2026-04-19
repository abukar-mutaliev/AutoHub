import { z } from "zod";

export const createAssignmentSchema = z.object({
  orderId: z.string().min(1),
  masterId: z.string().min(1)
});

export const reassignSchema = z.object({
  masterId: z.string().min(1)
});

export const assignmentLocationSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180)
});
