import { emitOrderPrice, emitOrderStatus } from "../lib/realtime.js";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

const allowedTransitions = {
  ASSIGNED: ["EN_ROUTE", "CANCELLED"],
  EN_ROUTE: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  PENDING: ["ASSIGNED", "CANCELLED"]
};

async function findOrderOrThrow(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { assignment: true, payment: true }
  });

  if (!order) {
    throw new HttpError(404, "NOT_FOUND", "Заказ не найден.");
  }

  return order;
}

export async function createOrder(clientId, payload) {
  const service = await prisma.service.findUnique({ where: { id: payload.serviceId } });
  if (!service || !service.isActive) {
    throw new HttpError(404, "NOT_FOUND", "Услуга не найдена или отключена.");
  }

  return prisma.order.create({
    data: {
      clientId,
      serviceId: payload.serviceId,
      priceType: service.priceType,
      estimatedMin: service.priceMin,
      estimatedMax: service.priceMax,
      calloutFee: service.calloutFee,
      carBrand: payload.carBrand,
      carModel: payload.carModel,
      carYear: payload.carYear,
      comment: payload.comment,
      address: payload.address,
      scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
      payment: {
        create: {
          calloutAmount: service.calloutFee,
          finalAmount: service.price,
          status: "PENDING"
        }
      }
    },
    include: {
      service: true,
      payment: true
    }
  });
}

export async function getOrdersForUser(user) {
  const whereByRole = {
    CLIENT: { clientId: user.id },
    MASTER: { assignment: { masterId: user.id } },
    OWNER: {}
  };

  const clientInclude =
    user.role === "OWNER"
      ? { select: { id: true, name: true, phone: true } }
      : { select: { id: true, name: true } };

  return prisma.order.findMany({
    where: whereByRole[user.role],
    orderBy: { createdAt: "desc" },
    include: {
      service: true,
      payment: true,
      assignment: {
        include: {
          master: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      client: clientInclude
    }
  });
}

export async function getOrderByIdForUser(user, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      assignment: {
        include: {
          master: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      client: {
        select: user.role === "OWNER" ? { id: true, name: true, phone: true } : { id: true, name: true }
      }
    }
  });

  if (!order) {
    throw new HttpError(404, "NOT_FOUND", "Заказ не найден.");
  }

  if (user.role === "CLIENT" && order.clientId !== user.id) {
    throw new HttpError(403, "FORBIDDEN", "Этот заказ не принадлежит вам.");
  }

  if (user.role === "MASTER") {
    if (!order.assignment || order.assignment.masterId !== user.id) {
      throw new HttpError(403, "FORBIDDEN", "У вас нет доступа к этому заказу (закреплён за другим мастером).");
    }
  }

  return order;
}

export async function updateOrderStatus(user, orderId, status) {
  const order = await findOrderOrThrow(orderId);

  if (user.role === "MASTER") {
    if (!order.assignment || order.assignment.masterId !== user.id) {
      throw new HttpError(403, "FORBIDDEN", "Этот заказ не назначен вам. Обновлять может только мастер, к которому назначен заказ.");
    }
  }

  if (user.role === "CLIENT") {
    throw new HttpError(403, "FORBIDDEN", "Статус меняет мастер или владелец, не клиент.");
  }

  const allowed = allowedTransitions[order.status] ?? [];
  if (!allowed.includes(status)) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Смена статуса в этом состоянии невозможна.");
  }

  const now = new Date();
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      assignedAt: status === "ASSIGNED" ? now : undefined,
      enRouteAt: status === "EN_ROUTE" ? now : undefined,
      inProgressAt: status === "IN_PROGRESS" ? now : undefined,
      doneAt: status === "DONE" ? now : undefined,
      cancelledAt: status === "CANCELLED" ? now : undefined
    }
  });
  emitOrderStatus(orderId, status);
  return updated;
}

export async function setFinalPrice(user, orderId, finalPrice) {
  const order = await findOrderOrThrow(orderId);

  if (!order.assignment || order.assignment.masterId !== user.id) {
    throw new HttpError(403, "FORBIDDEN", "Этот заказ не назначен вам. Итоговую цену вводит только мастер по заявке.");
  }

  if (!["EN_ROUTE", "IN_PROGRESS"].includes(order.status)) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Итоговая цена задаётся только в статусах «В пути» или «В работе».");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      finalPrice,
      payment: {
        update: {
          finalAmount: finalPrice,
          status: "AWAITING_FINAL"
        }
      }
    },
    include: { payment: true }
  });
  emitOrderPrice(orderId, finalPrice);
  return updated;
}

export async function approveOrderPrice(orderId) {
  const order = await findOrderOrThrow(orderId);

  if (!order.finalPrice) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Нельзя подтвердить цену, пока мастер не указал итоговую сумму.");
  }

  if (!order.payment || order.payment.status !== "AWAITING_FINAL") {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Цена уже обработана или заказ не готов к подтверждению.");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      priceApproved: true
    },
    include: { payment: true }
  });
}

export async function sendInvoice(orderId) {
  const order = await findOrderOrThrow(orderId);

  if (!order.payment) {
    throw new HttpError(404, "NOT_FOUND", "Платёж по заказу не найден.");
  }
  if (!order.finalPrice) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Нельзя отправить счёт без итоговой стоимости.");
  }
  if (!order.priceApproved) {
    throw new HttpError(409, "PRICE_NOT_APPROVED", "Сначала подтвердите цену, затем отправляйте счёт клиенту.");
  }
  if (order.payment.status !== "AWAITING_FINAL") {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Счёт уже отправлен или заказ не готов к отправке счёта.");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      payment: {
        update: {
          status: "FINAL_SENT"
        }
      }
    },
    include: { payment: true }
  });
}

export async function cancelOrder(user, orderId) {
  const order = await findOrderOrThrow(orderId);

  if (user.role === "CLIENT" && order.clientId !== user.id) {
    throw new HttpError(403, "FORBIDDEN", "Отменить можно только свой заказ.");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      payment: order.payment
        ? {
            update: {
              status: "REFUNDED"
            }
          }
        : undefined
    },
    include: { payment: true }
  });
}
