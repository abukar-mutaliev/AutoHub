import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { createMasterSchema, updateProfileSchema } from "../schemas/users.schema.js";
import { createMaster, getMasters, getProfile, updateMyProfile } from "../services/users.service.js";

export const usersRouter = Router();

usersRouter.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await getProfile(req.user.id);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
});

usersRouter.patch("/me", authMiddleware, validateMiddleware(updateProfileSchema), async (req, res, next) => {
  try {
    const user = await updateMyProfile(req.user.id, req.validatedBody);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
});

usersRouter.get("/masters", authMiddleware, roleMiddleware(["OWNER"]), async (_req, res, next) => {
  try {
    const masters = await getMasters();
    return res.json({ data: masters });
  } catch (error) {
    return next(error);
  }
});

usersRouter.post(
  "/master",
  authMiddleware,
  roleMiddleware(["OWNER"]),
  validateMiddleware(createMasterSchema),
  async (req, res, next) => {
    try {
      const master = await createMaster(req.validatedBody);
      return res.status(201).json({ data: master });
    } catch (error) {
      return next(error);
    }
  }
);
