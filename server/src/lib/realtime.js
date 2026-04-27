import { getIo } from "../socket/singleton.js";

export function emitOrderStatus(orderId, status) {
  const io = getIo();
  if (!io) {
    return;
  }
  const payload = { orderId, status };
  io.to(`order:${orderId}`).emit("order:status", payload);
  io.to("owner").emit("order:status", payload);
}

export function emitOrderPrice(orderId, finalPrice) {
  const io = getIo();
  if (!io) {
    return;
  }
  const payload = { orderId, finalPrice: finalPrice == null ? null : Number(finalPrice) };
  io.to(`order:${orderId}`).emit("order:price", payload);
  io.to("owner").emit("order:price", payload);
}

export function emitMasterLocation(assignmentId, lat, lng) {
  const io = getIo();
  if (!io) {
    return;
  }
  io.to("owner").emit("master:location", { assignmentId, lat, lng });
}
