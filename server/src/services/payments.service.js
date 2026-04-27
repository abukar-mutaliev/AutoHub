import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

async function findOrderWithPayment(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order) {
    throw new HttpError(404, "NOT_FOUND", "Заказ не найден.");
  }
  if (!order.payment) {
    throw new HttpError(404, "NOT_FOUND", "Платёж по заказу не найден.");
  }

  return order;
}

function assertClientOwnsOrder(userId, order) {
  if (order.clientId !== userId) {
    throw new HttpError(403, "FORBIDDEN", "Оплата доступна только владельцу заказа.");
  }
}

export async function payCallout(userId, orderId) {
  const order = await findOrderWithPayment(orderId);
  assertClientOwnsOrder(userId, order);

  if (!order.payment.calloutAmount) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Для этой услуги нет предоплаты за выезд.");
  }
  if (order.payment.status !== "PENDING") {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Предоплата уже выполнена или недоступна в текущем статусе.");
  }

  return prisma.payment.update({
    where: { orderId },
    data: {
      calloutPaidAt: new Date(),
      status: "CALLOUT_PAID"
    }
  });
}

export async function payFinal(userId, orderId) {
  const order = await findOrderWithPayment(orderId);
  assertClientOwnsOrder(userId, order);

  if (!order.payment.finalAmount) {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Итоговая сумма ещё не выставлена.");
  }

  if (order.priceType === "FIXED") {
    if (order.payment.status !== "PENDING") {
      throw new HttpError(409, "ORDER_WRONG_STATUS", "Оплата для фиксированной услуги уже выполнена.");
    }
  } else if (order.payment.status !== "FINAL_SENT") {
    throw new HttpError(409, "ORDER_WRONG_STATUS", "Итоговый счёт пока не отправлен владельцем.");
  }

  return prisma.payment.update({
    where: { orderId },
    data: {
      finalPaidAt: new Date(),
      status: "COMPLETED"
    }
  });
}

export async function getPaymentByOrder(user, orderId) {
  const order = await findOrderWithPayment(orderId);
  if (user.role === "CLIENT") {
    assertClientOwnsOrder(user.id, order);
  }
  if (!["CLIENT", "OWNER"].includes(user.role)) {
    throw new HttpError(403, "FORBIDDEN", "Статус оплаты доступен только клиенту или владельцу.");
  }

  return order.payment;
}
