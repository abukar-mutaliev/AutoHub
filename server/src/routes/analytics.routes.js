import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { getMastersAnalytics, getOrdersAnalytics, getRevenueAnalytics } from "../services/analytics.service.js";

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware, roleMiddleware(["OWNER"]));

analyticsRouter.get("/revenue", async (req, res, next) => {
  try {
    const data = await getRevenueAnalytics(req.query.period);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

analyticsRouter.get("/masters", async (req, res, next) => {
  try {
    const data = await getMastersAnalytics(req.query.period);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});

analyticsRouter.get("/orders", async (req, res, next) => {
  try {
    const data = await getOrdersAnalytics(req.query.period);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
});
