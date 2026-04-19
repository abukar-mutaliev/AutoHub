import { useEffect, useState } from "react";
import { getOrders, setFinalPrice, updateOrderStatus } from "../../../features/orders";
import { orderStatusLabel } from "../../../shared/lib/orderStatus";

const nextStatusByCurrent = {
  PENDING: "ASSIGNED",
  ASSIGNED: "EN_ROUTE",
  EN_ROUTE: "IN_PROGRESS",
  IN_PROGRESS: "DONE"
};

export function MasterPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [priceByOrder, setPriceByOrder] = useState({});

  async function reloadOrders() {
    const result = await getOrders();
    setOrders(result.data);
  }

  useEffect(() => {
    reloadOrders().catch(() => setMessage("Не удалось загрузить заказы мастера."));
  }, []);

  const onMoveNext = async (orderId, currentStatus) => {
    const nextStatus = nextStatusByCurrent[currentStatus];
    if (!nextStatus) return;

    try {
      await updateOrderStatus(orderId, nextStatus);
      setMessage(`Статус изменён: ${orderStatusLabel(nextStatus)}.`);
      await reloadOrders();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Не удалось обновить статус.");
    }
  };

  const onSetFinalPrice = async (orderId) => {
    const value = Number(priceByOrder[orderId]);
    if (!value || value <= 0) return;

    try {
      await setFinalPrice(orderId, value);
      setMessage("Итоговая цена отправлена владельцу.");
      await reloadOrders();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Не удалось отправить итоговую цену.");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Панель мастера</h1>
        <p style={styles.subtitle}>Обновляйте этап работы и отправляйте финальную стоимость владельцу.</p>
        {message ? <p style={styles.message}>{message}</p> : null}

        <div style={styles.list}>
          {orders.map((order) => (
            <article key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong style={styles.service}>{order.service?.name ?? "Без услуги"}</strong>
                <span style={styles.status}>{orderStatusLabel(order.status)}</span>
              </div>
              <div style={styles.actions}>
                {nextStatusByCurrent[order.status] ? (
                  <button type="button" style={styles.primaryButton} onClick={() => onMoveNext(order.id, order.status)}>
                    {order.status === "PENDING"
                      ? "Взять в работу"
                      : `Перевести в «${orderStatusLabel(nextStatusByCurrent[order.status])}»`}
                  </button>
                ) : null}
                {["EN_ROUTE", "IN_PROGRESS"].includes(order.status) ? (
                  <div style={styles.priceRow}>
                    <input
                      style={styles.input}
                      type="number"
                      placeholder="Итоговая цена"
                      value={priceByOrder[order.id] ?? ""}
                      onChange={(event) =>
                        setPriceByOrder((prev) => ({ ...prev, [order.id]: event.target.value }))
                      }
                    />
                    <button type="button" style={styles.secondaryButton} onClick={() => onSetFinalPrice(order.id)}>
                      Отправить цену
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {!orders.length ? <p style={styles.empty}>Пока нет назначенных заказов.</p> : null}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "36px 20px 56px",
    background:
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 45%), #0f172a",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  panel: {
    maxWidth: "980px",
    margin: "0 auto",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.68)",
    padding: "24px",
    backdropFilter: "blur(8px)",
  },
  title: { margin: 0, fontSize: "34px", color: "#f8fafc" },
  subtitle: { margin: "10px 0 20px", color: "#cbd5e1" },
  message: { margin: "0 0 14px", color: "#bfdbfe" },
  list: { display: "grid", gap: "12px" },
  card: {
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(30, 41, 59, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  service: { color: "#e2e8f0" },
  status: {
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 700,
  },
  actions: { display: "grid", gap: "10px" },
  primaryButton: {
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    height: "40px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 14px",
  },
  priceRow: { display: "flex", gap: "8px", flexWrap: "wrap" },
  input: {
    flex: "1 1 180px",
    minWidth: "160px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    padding: "0 12px",
    outline: "none",
  },
  empty: { margin: 0, color: "#94a3b8" },
};
