export const ORDER_STATUS_RU = {
  PENDING: "В ожидании",
  ASSIGNED: "Назначен мастеру",
  EN_ROUTE: "В пути",
  IN_PROGRESS: "В работе",
  DONE: "Выполнен",
  CANCELLED: "Отменён"
};

export function orderStatusLabel(status) {
  if (!status) return "—";
  return ORDER_STATUS_RU[status] ?? status;
}
