import { useEffect, useState } from "react";
import { getOrders } from "../../../features/orders";
import { orderStatusLabel } from "../../../shared/lib/orderStatus";

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrders()
      .then((result) => setOrders(result.data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error?.message ?? "Не удалось загрузить заказы");
      });
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Мои заказы</h1>
        <p style={styles.subtitle}>Отслеживайте текущий статус заявок и выбранные услуги.</p>
        {error ? <p style={styles.error}>{error}</p> : null}
        <div style={styles.list}>
          {orders.map((order) => (
            <article key={order.id} style={styles.card}>
              <p style={styles.orderId}>#{order.id.slice(0, 8)}</p>
              <p style={styles.service}>{order.service?.name ?? "Без услуги"}</p>
              <span style={styles.status}>{orderStatusLabel(order.status)}</span>
            </article>
          ))}
          {!orders.length && !error ? <p style={styles.empty}>Пока нет созданных заказов.</p> : null}
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
    maxWidth: "900px",
    margin: "0 auto",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.68)",
    padding: "24px",
    backdropFilter: "blur(8px)",
  },
  title: { margin: 0, fontSize: "34px", color: "#f8fafc" },
  subtitle: { margin: "10px 0 20px", color: "#cbd5e1" },
  error: { color: "#fca5a5", marginBottom: "14px" },
  list: {
    display: "grid",
    gap: "12px",
  },
  card: {
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(30, 41, 59, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  orderId: { margin: 0, color: "#93c5fd", fontWeight: 600 },
  service: { margin: "8px 0", color: "#e2e8f0" },
  status: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
    fontSize: "13px",
    fontWeight: 600,
  },
  empty: { margin: 0, color: "#94a3b8" },
};
