import { Router } from "express";
import { auditFinance } from "../lib/logger.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { createOrderSchema, setFinalPriceSchema, updateOrderStatusSchema } from "../schemas/orders.schema.js";
import { approveOrderPrice, cancelOrder, createOrder, getOrderByIdForUser, getOrdersForUser, sendInvoice, setFinalPrice, updateOrderStatus } from "../services/orders.service.js";

export const ordersRouter = Router();

ordersRouter.use(authMiddleware);

ordersRouter.post(
  "/",
  roleMiddleware(["CLIENT"], {
    message: "Создать заказ могут только клиенты. Войдите под обычным аккаунтом, не мастером/админом."
  }),
  validateMiddleware(createOrderSchema),
  async (req, res, next) => {
  try {
    const order = await createOrder(req.user.id, req.validatedBody);
    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.get("/", async (req, res, next) => {
  try {
    const orders = await getOrdersForUser(req.user);
    return res.json({ data: orders });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const order = await getOrderByIdForUser(req.user, req.params.id);
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.patch("/:id/status", roleMiddleware(["MASTER", "OWNER"]), validateMiddleware(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.user, req.params.id, req.validatedBody.status);
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.patch("/:id/final-price", roleMiddleware(["MASTER"]), validateMiddleware(setFinalPriceSchema), async (req, res, next) => {
  try {
    const order = await setFinalPrice(req.user, req.params.id, req.validatedBody.finalPrice);
    auditFinance("order_final_price", {
      requestId: req.requestId,
      userId: req.user.id,
      role: req.user.role,
      orderId: req.params.id,
      body: req.validatedBody
    });
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.patch("/:id/approve-price", roleMiddleware(["OWNER"]), async (req, res, next) => {
  try {
    const order = await approveOrderPrice(req.params.id);
    auditFinance("order_approve_price", {
      requestId: req.requestId,
      userId: req.user.id,
      role: req.user.role,
      orderId: req.params.id
    });
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/:id/cancel", roleMiddleware(["CLIENT", "OWNER"]), async (req, res, next) => {
  try {
    const order = await cancelOrder(req.user, req.params.id);
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});

ordersRouter.post("/:id/send-invoice", roleMiddleware(["OWNER"]), async (req, res, next) => {
  try {
    const order = await sendInvoice(req.params.id);
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});
