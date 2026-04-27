import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { paymentOrderSchema } from "../schemas/payments.schema.js";
import { getPaymentByOrder, payCallout, payFinal } from "../services/payments.service.js";

export const paymentsRouter = Router();

paymentsRouter.use(authMiddleware);

paymentsRouter.post("/callout", roleMiddleware(["CLIENT"]), validateMiddleware(paymentOrderSchema), async (req, res, next) => {
  try {
    const payment = await payCallout(req.user.id, req.validatedBody.orderId);
    return res.json({ data: payment });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.post("/final", roleMiddleware(["CLIENT"]), validateMiddleware(paymentOrderSchema), async (req, res, next) => {
  try {
    const payment = await payFinal(req.user.id, req.validatedBody.orderId);
    return res.json({ data: payment });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.get("/:orderId", roleMiddleware(["CLIENT", "OWNER"]), async (req, res, next) => {
  try {
    const payment = await getPaymentByOrder(req.user, req.params.orderId);
    return res.json({ data: payment });
  } catch (error) {
    return next(error);
  }
});
