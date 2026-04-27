import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { subscribeMasterPush, unsubscribeMasterPush } from "../../../features/push";
import { getOrders, setFinalPrice, updateOrderStatus } from "../../../features/orders";
import { getAccessToken } from "../../../shared/api/axiosClient";
import { getApiOrigin } from "../../../shared/lib/apiOrigin";
import { getAuthUser } from "../../../shared/lib/auth";
import { orderStatusLabel } from "../../../shared/lib/orderStatus";
import { OrderDetailSections } from "../../../shared/ui/OrderDetailSections";

const nextStatusByCurrent = {
  PENDING: "ASSIGNED",
  ASSIGNED: "EN_ROUTE",
  EN_ROUTE: "IN_PROGRESS",
  IN_PROGRESS: "DONE"
};

function parseFinalPrice(rawValue) {
  if (rawValue == null) return null;
  const normalized = String(rawValue).trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function MasterPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [priceByOrder, setPriceByOrder] = useState({});
  const [socketOk, setSocketOk] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const socketRef = useRef(null);

  async function reloadOrders() {
    const result = await getOrders();
    setOrders(result.data);
  }

  const reloadRef = useRef(reloadOrders);
  reloadRef.current = reloadOrders;

  useEffect(() => {
    reloadOrders().catch(() => setMessage("Не удалось загрузить заказы мастера."));
  }, []);

  useEffect(() => {
    if (getAuthUser()?.role !== "MASTER" || !("serviceWorker" in navigator)) {
      return undefined;
    }
    let cancelled = false;
    navigator.serviceWorker.ready
      .then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setPushOn(!!sub);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (getAuthUser()?.role !== "MASTER") {
      return undefined;
    }
    const token = getAccessToken();
    if (!token) {
      return undefined;
    }
    const socket = io(getApiOrigin(), {
      auth: { token: `Bearer ${token}` },
      withCredentials: true
    });
    socketRef.current = socket;
    const onConnect = () => setSocketOk(true);
    const onDisconnect = () => setSocketOk(false);
    const refresh = () => {
      void reloadRef.current();
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:status", refresh);
    socket.on("order:price", refresh);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return undefined;
    }
    orders.forEach((order) => {
      if (order.assignment) {
        socket.emit("join:order", { orderId: order.id });
      }
    });
    return undefined;
  }, [orders]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return undefined;
    }
    const enRoute = orders.filter((order) => order.status === "EN_ROUTE" && order.assignment?.id);
    if (!enRoute.length) {
      return undefined;
    }
    const send = () => {
      enRoute.forEach((order) => {
        const lat = Number(order.geoLat ?? 55.7558);
        const lng = Number(order.geoLng ?? 37.6173);
        socket.emit("assignment:location", { assignmentId: order.assignment.id, lat, lng });
      });
    };
    send();
    const id = setInterval(send, 30000);
    return () => clearInterval(id);
  }, [orders]);

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

  const onEnablePush = async () => {
    setPushBusy(true);
    try {
      await subscribeMasterPush();
      setPushOn(true);
      setMessage("Push-уведомления включены (в т.ч. при новом назначении).");
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? error.message ?? "Не удалось включить push.");
    } finally {
      setPushBusy(false);
    }
  };

  const onDisablePush = async () => {
    setPushBusy(true);
    try {
      await unsubscribeMasterPush();
      setPushOn(false);
      setMessage("Push отключён.");
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? error.message ?? "Не удалось отключить push.");
    } finally {
      setPushBusy(false);
    }
  };

  const onSetFinalPrice = async (orderId) => {
    const value = parseFinalPrice(priceByOrder[orderId]);
    if (value == null) {
      setMessage("Укажите корректную итоговую цену (число больше 0).");
      return;
    }

    try {
      await setFinalPrice(orderId, value);
      setMessage("Итоговая цена отправлена владельцу.");
      setPriceByOrder((prev) => ({ ...prev, [orderId]: "" }));
      await reloadOrders();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Не удалось отправить итоговую цену.");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Панель мастера</h1>
        <p style={styles.subtitle}>
          Обновляйте этап работы и отправляйте финальную стоимость владельцу. Real-time:{" "}
          {socketOk ? "ON" : "OFF"} · координаты в «В пути» каждые 30 с (или из заказа, если нет GPS).
        </p>
        <div style={styles.pwaRow}>
          <span style={styles.pwaLabel}>PWA / push: {pushOn ? "включено" : "выключено"}</span>
          {pushOn ? (
            <button type="button" style={styles.ghostButton} disabled={pushBusy} onClick={() => void onDisablePush()}>
              Отключить уведомления
            </button>
          ) : (
            <button type="button" style={styles.ghostButton} disabled={pushBusy} onClick={() => void onEnablePush()}>
              Включить уведомления
            </button>
          )}
        </div>
        {message ? <p style={styles.message}>{message}</p> : null}

        <div style={styles.list}>
          {orders.map((order) => (
            <article key={order.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong style={styles.service}>{order.service?.name ?? "Без услуги"}</strong>
                <span style={styles.status}>{orderStatusLabel(order.status)}</span>
              </div>

              {order.service?.description ? (
                <p style={styles.serviceDescription}>{order.service.description}</p>
              ) : null}

              <OrderDetailSections order={order} showMasterSection={false} hideClientPhone />

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
    flexWrap: "wrap",
  },
  service: { color: "#e2e8f0", fontSize: "18px" },
  serviceDescription: {
    margin: "0 0 12px",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#94a3b8",
  },
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
  pwaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.45)"
  },
  pwaLabel: { color: "#cbd5e1", fontSize: "14px" },
  ghostButton: {
    height: "34px",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 12px",
    fontSize: "13px"
  }
};
