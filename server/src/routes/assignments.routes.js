import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { assignmentLocationSchema, createAssignmentSchema, reassignSchema } from "../schemas/assignments.schema.js";
import { createAssignment, getActiveAssignments, reassign, updateAssignmentLocation } from "../services/assignments.service.js";

export const assignmentsRouter = Router();

assignmentsRouter.use(authMiddleware);

assignmentsRouter.post("/", roleMiddleware(["OWNER"]), validateMiddleware(createAssignmentSchema), async (req, res, next) => {
  try {
    const assignment = await createAssignment(req.validatedBody);
    return res.status(201).json({ data: assignment });
  } catch (error) {
    return next(error);
  }
});

assignmentsRouter.patch("/:id", roleMiddleware(["OWNER"]), validateMiddleware(reassignSchema), async (req, res, next) => {
  try {
    const assignment = await reassign(req.params.id, req.validatedBody.masterId);
    return res.json({ data: assignment });
  } catch (error) {
    return next(error);
  }
});

assignmentsRouter.patch("/:id/location", roleMiddleware(["MASTER"]), validateMiddleware(assignmentLocationSchema), async (req, res, next) => {
  try {
    const assignment = await updateAssignmentLocation(req.user, req.params.id, req.validatedBody);
    return res.json({ data: assignment });
  } catch (error) {
    return next(error);
  }
});

assignmentsRouter.get("/active", roleMiddleware(["OWNER"]), async (_req, res, next) => {
  try {
    const assignments = await getActiveAssignments();
    return res.json({ data: assignments });
  } catch (error) {
    return next(error);
  }
});
