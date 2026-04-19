import { useEffect, useMemo, useState } from "react";
import { createAssignment } from "../../../features/assignments";
import { approvePrice, getOrders } from "../../../features/orders";
import { createMaster, getMasters } from "../../../features/users";

export function OwnerPage() {
  const [orders, setOrders] = useState([]);
  const [masters, setMasters] = useState([]);
  const [message, setMessage] = useState("");
  const [masterForm, setMasterForm] = useState({ name: "", phone: "", email: "", password: "" });

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING" && !order.assignment), [orders]);
  const waitingApproveOrders = useMemo(() => orders.filter((order) => order.payment?.status === "AWAITING_FINAL"), [orders]);

  async function reloadData() {
    const [ordersResult, mastersResult] = await Promise.all([getOrders(), getMasters()]);
    setOrders(ordersResult.data);
    setMasters(mastersResult.data);
  }

  useEffect(() => {
    reloadData().catch(() => setMessage("Не удалось загрузить данные owner панели."));
  }, []);

  const onAssign = async (orderId, masterId) => {
    if (!masterId) return;

    try {
      await createAssignment({ orderId, masterId });
      setMessage("Мастер назначен.");
      await reloadData();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Ошибка назначения.");
    }
  };

  const onCreateMaster = async (event) => {
    event.preventDefault();
    try {
      await createMaster(masterForm);
      setMasterForm({ name: "", phone: "", email: "", password: "" });
      setMessage("Мастер создан.");
      await reloadData();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Ошибка создания мастера.");
    }
  };

  const onApprovePrice = async (orderId) => {
    try {
      await approvePrice(orderId);
      setMessage("Цена подтверждена и счет готов к отправке клиенту.");
      await reloadData();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Ошибка подтверждения цены.");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Панель владельца</h1>
        <p style={styles.subtitle}>Управляйте мастерами, назначениями и подтверждением стоимости работ.</p>
        {message ? <p style={styles.message}>{message}</p> : null}

        <div style={styles.grid}>
          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Создать мастера</h2>
            <form style={styles.form} onSubmit={onCreateMaster}>
              <input
                style={styles.input}
                placeholder="Имя"
                value={masterForm.name}
                onChange={(e) => setMasterForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                style={styles.input}
                placeholder="Телефон"
                value={masterForm.phone}
                onChange={(e) => setMasterForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <input
                style={styles.input}
                placeholder="Email"
                value={masterForm.email}
                onChange={(e) => setMasterForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                style={styles.input}
                placeholder="Пароль"
                type="password"
                value={masterForm.password}
                onChange={(e) => setMasterForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button type="submit" style={styles.primaryButton}>
                Создать
              </button>
            </form>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Активные мастера</h2>
            <div style={styles.list}>
              {masters.map((master) => (
                <article key={master.id} style={styles.item}>
                  {master.name} - {master.phone}
                </article>
              ))}
              {!masters.length ? <p style={styles.empty}>Список мастеров пуст.</p> : null}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Ожидают назначения</h2>
            <div style={styles.list}>
              {pendingOrders.map((order) => (
                <article key={order.id} style={styles.item}>
                  <span>
                    #{order.id.slice(0, 8)} - {order.service?.name}
                  </span>
                  <select style={styles.select} defaultValue="" onChange={(e) => onAssign(order.id, e.target.value)}>
                    <option value="" disabled>
                      Выберите мастера
                    </option>
                    {masters.map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.name}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
              {!pendingOrders.length ? <p style={styles.empty}>Нет заказов для назначения.</p> : null}
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Ожидают подтверждения цены</h2>
            <div style={styles.list}>
              {waitingApproveOrders.map((order) => (
                <article key={order.id} style={styles.item}>
                  <span>
                    #{order.id.slice(0, 8)} - {order.service?.name} - сумма:{" "}
                    {order.finalPrice ?? order.payment?.finalAmount ?? "-"}
                  </span>
                  <button type="button" style={styles.secondaryButton} onClick={() => onApprovePrice(order.id)}>
                    Подтвердить цену
                  </button>
                </article>
              ))}
              {!waitingApproveOrders.length ? <p style={styles.empty}>Нет цен на подтверждение.</p> : null}
            </div>
          </section>
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
    maxWidth: "1100px",
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
  grid: { display: "grid", gap: "12px" },
  card: {
    borderRadius: "14px",
    padding: "14px",
    background: "rgba(30, 41, 59, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  sectionTitle: { margin: "0 0 12px", fontSize: "20px", color: "#f8fafc" },
  form: { display: "grid", gap: "10px" },
  input: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    padding: "0 12px",
    outline: "none",
  },
  primaryButton: {
    marginTop: "4px",
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    height: "36px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 12px",
  },
  list: { display: "grid", gap: "10px" },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    padding: "10px",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  select: {
    minWidth: "190px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    padding: "0 10px",
  },
  empty: { margin: 0, color: "#94a3b8" },
};
