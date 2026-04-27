import { emitMasterLocation } from "../lib/realtime.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { notifyMasterNewAssignment } from "./push.service.js";

async function ensureMaster(masterId) {
  const master = await prisma.user.findUnique({ where: { id: masterId } });
  if (!master || master.role !== "MASTER") {
    throw new HttpError(404, "NOT_FOUND", "Master not found");
  }
}

export async function createAssignment(payload) {
  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    include: { assignment: true }
  });

  if (!order) {
    throw new HttpError(404, "NOT_FOUND", "Order not found");
  }
  if (order.assignment) {
    throw new HttpError(409, "CONFLICT", "Order already has assignment");
  }

  await ensureMaster(payload.masterId);

  const created = await prisma.assignment.create({
    data: {
      orderId: payload.orderId,
      masterId: payload.masterId
    },
    include: {
      order: { include: { service: true } },
      master: {
        select: { id: true, name: true, phone: true }
      }
    }
  });
  void notifyMasterNewAssignment(payload.masterId, {
    body: `Вам назначена заявка: ${created.order?.service?.name ?? "заявка"}`,
    orderId: created.orderId,
    url: "/master"
  }).catch(() => {});
  return created;
}

export async function reassign(assignmentId, masterId) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    throw new HttpError(404, "NOT_FOUND", "Assignment not found");
  }

  await ensureMaster(masterId);

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { masterId },
    include: {
      order: { include: { service: true } },
      master: { select: { id: true, name: true, phone: true } }
    }
  });
  void notifyMasterNewAssignment(masterId, {
    body: `Вам переназначена заявка: ${updated.order?.service?.name ?? "заявка"}`,
    orderId: updated.orderId,
    url: "/master"
  }).catch(() => {});
  return updated;
}

export async function updateAssignmentLocation(user, assignmentId, payload) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    throw new HttpError(404, "NOT_FOUND", "Assignment not found");
  }
  if (assignment.masterId !== user.id) {
    throw new HttpError(403, "FORBIDDEN", "Assignment does not belong to current master");
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { gpsLat: payload.lat, gpsLng: payload.lng }
  });
  emitMasterLocation(assignmentId, payload.lat, payload.lng);
  return updated;
}

export async function getActiveAssignments() {
  return prisma.assignment.findMany({
    where: {
      order: {
        status: {
          in: ["ASSIGNED", "EN_ROUTE", "IN_PROGRESS"]
        }
      }
    },
    include: {
      order: true,
      master: {
        select: { id: true, name: true, phone: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
