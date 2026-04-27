import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "../schemas/push.schema.js";
import { getVapidPublicKeyForClient, removePushSubscription, savePushSubscription } from "../services/push.service.js";

export const pushRouter = Router();

pushRouter.get("/vapid-public", (_req, res) => {
  const publicKey = getVapidPublicKeyForClient();
  if (!publicKey) {
    return res.status(503).json({
      error: {
        code: "PUSH_NOT_CONFIGURED",
        message: "Web Push не настроен. Задайте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY на сервере."
      }
    });
  }
  return res.json({ data: { publicKey } });
});

pushRouter.use(authMiddleware);

pushRouter.post(
  "/subscribe",
  roleMiddleware(["MASTER"]),
  validateMiddleware(pushSubscribeSchema),
  async (req, res, next) => {
    try {
      const saved = await savePushSubscription(req.user.id, req.validatedBody.subscription);
      if (!saved) {
        return res.status(503).json({
          error: {
            code: "PUSH_NOT_CONFIGURED",
            message: "Web Push не настроен."
          }
        });
      }
      return res.status(201).json({ data: { ok: true, id: saved.id } });
    } catch (error) {
      return next(error);
    }
  }
);

pushRouter.post(
  "/unsubscribe",
  roleMiddleware(["MASTER"]),
  validateMiddleware(pushUnsubscribeSchema),
  async (req, res, next) => {
    try {
      await removePushSubscription(req.user.id, req.validatedBody.endpoint);
      return res.json({ data: { ok: true } });
    } catch (error) {
      return next(error);
    }
  }
);
