import { Server } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { updateAssignmentLocation } from "../services/assignments.service.js";
import { setSocketIo } from "./singleton.js";
import { env } from "../config/env.js";

const allowedOrigins = new Set([env.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);

async function canJoinOrder(user, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { assignment: true }
  });
  if (!order) {
    return false;
  }
  if (user.role === "OWNER") {
    return true;
  }
  if (user.role === "CLIENT" && order.clientId === user.id) {
    return true;
  }
  if (user.role === "MASTER" && order.assignment?.masterId === user.id) {
    return true;
  }
  return false;
}

function setupSocketIo(io) {
  io.use((socket, next) => {
    const raw = socket.handshake.auth?.token;
    const token = typeof raw === "string" && raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    if (!token || typeof token !== "string") {
      return next(new Error("UNAUTHORIZED"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:order", async ({ orderId }, callback) => {
      try {
        if (!orderId) {
          callback?.({ ok: false, error: "orderId required" });
          return;
        }
        const allowed = await canJoinOrder(socket.user, orderId);
        if (!allowed) {
          callback?.({ ok: false, error: "forbidden" });
          return;
        }
        await socket.join(`order:${orderId}`);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "error" });
      }
    });

    socket.on("join:owner", (payload, callback) => {
      if (socket.user?.role !== "OWNER") {
        callback?.({ ok: false, error: "forbidden" });
        return;
      }
      void socket.join("owner");
      callback?.({ ok: true });
    });

    socket.on("assignment:location", async ({ assignmentId, lat, lng }, callback) => {
      if (socket.user?.role !== "MASTER") {
        callback?.({ ok: false, error: "forbidden" });
        return;
      }
      if (!assignmentId || lat == null || lng == null) {
        callback?.({ ok: false, error: "invalid payload" });
        return;
      }
      try {
        await updateAssignmentLocation(socket.user, assignmentId, { lat, lng });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, error: error?.message ?? "error" });
      }
    });
  });
}

export function initSocketIo(httpServer) {
  const ioInstance = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin is not allowed"));
      },
      credentials: true
    }
  });
  setSocketIo(ioInstance);
  setupSocketIo(ioInstance);
  return ioInstance;
}
