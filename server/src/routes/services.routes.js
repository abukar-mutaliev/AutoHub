import { Router } from "express";
import { getActiveServices } from "../services/services.service.js";

export const servicesRouter = Router();

servicesRouter.get("/", async (_req, res, next) => {
  try {
    const services = await getActiveServices();
    return res.json({ data: services });
  } catch (error) {
    return next(error);
  }
});
