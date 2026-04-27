import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getOrders, updateOrderStatus } from "../../../features/orders";
import { getAccessToken } from "../../../shared/api/axiosClient";
import { getApiOrigin } from "../../../shared/lib/apiOrigin";
import { getAuthUser } from "../../../shared/lib/auth";
import { orderStatusLabel } from "../../../shared/lib/orderStatus";
import {
  formatDateTime,
  OrderDetailSections,
  workPriceHint,
} from "../../../shared/ui/OrderDetailSections";

function buildCarLabel(order) {
  return [order.carBrand, order.carModel, order.carYear].filter(Boolean).join(" · ") || "—";
}

const STATUS_FLOW = ["PENDING", "ASSIGNED", "EN_ROUTE", "IN_PROGRESS", "DONE"];
const PAYMENT_STATUS_LABELS = {
  PENDING: "Ожидает оплаты выезда",
  CALLOUT_PAID: "Выезд оплачен",
  AWAITING_FINAL: "Ожидает итоговую оплату",
  FINAL_SENT: "Счёт отправлен",
  COMPLETED: "Оплачено",
  REFUNDED: "Возврат",
};

const STATUS_STYLES = {
  PENDING: {
    background: "#334155",
    color: "#e2e8f0",
  },
  ASSIGNED: {
    background: "#1d4ed8",
    color: "#dbeafe",
  },
  EN_ROUTE: {
    background: "#c2410c",
    color: "#ffedd5",
  },
  IN_PROGRESS: {
    background: "#7e22ce",
    color: "#f3e8ff",
  },
  DONE: {
    background: "#15803d",
    color: "#dcfce7",
  },
  CANCELLED: {
    background: "#b91c1c",
    color: "#fee2e2",
  },
};

function buildStatusHistory(status) {
  const currentIndex = STATUS_FLOW.indexOf(status);
  return [
    { code: "PENDING", label: "Заявка создана", done: currentIndex >= 0 || status === "CANCELLED" },
    { code: "ASSIGNED", label: "Мастер назначен", done: currentIndex >= 1 },
    { code: "EN_ROUTE", label: "Мастер в пути", done: currentIndex >= 2 },
    { code: "IN_PROGRESS", label: "Работа выполняется", done: currentIndex >= 3 },
    { code: "DONE", label: "Работа завершена", done: currentIndex >= 4 },
  ];
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const socketRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 1280;
    }

    return window.innerWidth;
  });

  const role = useMemo(() => getAuthUser()?.role ?? null, []);
  const detailCards = role === "OWNER" || role === "MASTER";
  const isMobile = viewportWidth <= 768;
  const pageTitle = role === "OWNER" ? "Заказы клиентов" : role === "MASTER" ? "Заказы мастера" : "Мои заказы";
  const activeOrders = useMemo(
    () => orders.filter((order) => !["DONE", "CANCELLED"].includes(order.status)),
    [orders]
  );
  const historyOrders = useMemo(
    () => orders.filter((order) => ["DONE", "CANCELLED"].includes(order.status)),
    [orders]
  );
  const visibleOrders = activeTab === "history" ? historyOrders : activeOrders;
  const statusPillStyle = (status) => STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  const nextStatusByCurrent = {
    PENDING: "ASSIGNED",
    ASSIGNED: "EN_ROUTE",
    EN_ROUTE: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
  };

  const reloadOrders = useCallback(async () => {
    const result = await getOrders();
    setOrders(result.data);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [reloadOrders]);

  useEffect(() => {
    reloadOrders()
      .then(() => setError(""))
      .catch((requestError) => {
        setError(requestError.response?.data?.error?.message ?? "Не удалось загрузить заказы");
      });
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return undefined;

    const socket = io(getApiOrigin(), {
      auth: { token: `Bearer ${token}` },
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("order:status", () => {
      void reloadOrders();
    });

    socket.on("order:price", () => {
      void reloadOrders();
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [reloadOrders]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !orders.length) return;
    orders.forEach((order) => {
      socket.emit("join:order", { orderId: order.id }, () => {});
    });
  }, [orders]);

  const onMoveNext = async (orderId, currentStatus) => {
    const nextStatus = nextStatusByCurrent[currentStatus];
    if (!nextStatus) return;

    try {
      await updateOrderStatus(orderId, nextStatus);
      setMessage(
        currentStatus === "PENDING"
          ? "Заказ взят в работу."
          : `Статус изменён: ${orderStatusLabel(nextStatus)}.`
      );
      setError("");
      await reloadOrders();
    } catch (requestError) {
      setMessage("");
      setError(requestError.response?.data?.error?.message ?? "Не удалось обновить статус заказа.");
    }
  };

  return (
    <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : null) }}>
      <section style={{ ...styles.panel, ...(isMobile ? styles.panelMobile : null) }}>
        <div style={{ ...styles.header, ...(isMobile ? styles.headerMobile : null) }}>
          <div style={styles.headerCopy}>
            <span style={styles.eyebrow}>Заказы</span>
            <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : null) }}>{pageTitle}</h1>
            <p style={styles.subtitle}>
              Отслеживайте текущий статус заявок и быстро переходите к важным деталям без
              перегруженных карточек.
            </p>
          </div>
          <div style={{ ...styles.summaryCard, ...(isMobile ? styles.summaryCardMobile : null) }}>
            <span style={styles.summaryLabel}>
              {activeTab === "history" ? "В истории" : "Текущих заявок"}
            </span>
            <strong style={styles.summaryValue}>{visibleOrders.length}</strong>
          </div>
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}
        {message ? <p style={styles.message}>{message}</p> : null}
        <div style={styles.tabsRow}>
          <button
            type="button"
            style={{ ...styles.tabButton, ...(activeTab === "active" ? styles.tabButtonActive : null) }}
            onClick={() => setActiveTab("active")}
          >
            Текущие
          </button>
          <button
            type="button"
            style={{ ...styles.tabButton, ...(activeTab === "history" ? styles.tabButtonActive : null) }}
            onClick={() => setActiveTab("history")}
          >
            История
          </button>
        </div>
        <div style={{ ...styles.list, ...(isMobile ? styles.listMobile : null) }}>
          {visibleOrders.map((order) =>
            detailCards ? (
              <article
                key={order.id}
                style={{ ...styles.cardWide, ...(isMobile ? styles.cardMobile : null) }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderMain}>
                    <p style={styles.orderId}>#{order.id.slice(0, 8)}</p>
                    <strong style={styles.serviceTitle}>{order.service?.name ?? "Без услуги"}</strong>
                  </div>
                  <span style={{ ...styles.status, ...statusPillStyle(order.status) }}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>

                <div
                  style={{
                    ...styles.metaGrid,
                    ...(isMobile ? styles.metaGridMobile : null),
                  }}
                >
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Автомобиль</span>
                    <span style={styles.metaValue}>{buildCarLabel(order)}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Клиент</span>
                    <span style={styles.metaValue}>{order.client?.name ?? "Не указан"}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Запланировано</span>
                    <span style={styles.metaValue}>
                      {formatDateTime(order.scheduledAt) ?? "Не указано"}
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Ориентир по цене</span>
                    <span style={styles.metaValue}>{workPriceHint(order)}</span>
                  </div>
                </div>

                {order.service?.description ? (
                  <p style={styles.serviceDescription}>{order.service.description}</p>
                ) : null}

                {order.comment?.trim() ? (
                  <div style={styles.commentPreview}>
                    <span style={styles.commentLabel}>Комментарий клиента</span>
                    <p style={styles.commentText}>{order.comment.trim()}</p>
                  </div>
                ) : null}

                <details style={styles.detailsToggle}>
                  <summary style={styles.detailsSummary}>Подробнее о заявке</summary>
                  <div style={styles.detailsContent}>
                    <OrderDetailSections order={order} showMasterSection />
                  </div>
                </details>

                {role === "MASTER" && activeTab === "active" && nextStatusByCurrent[order.status] ? (
                  <div style={styles.actionsRow}>
                    <button
                      type="button"
                      style={styles.primaryButton}
                      onClick={() => onMoveNext(order.id, order.status)}
                    >
                      {order.status === "PENDING"
                        ? "Взять в работу"
                        : `Перевести в «${orderStatusLabel(nextStatusByCurrent[order.status])}»`}
                    </button>
                  </div>
                ) : null}
              </article>
            ) : (
              <article
                key={order.id}
                style={{ ...styles.card, ...(isMobile ? styles.cardMobile : null) }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardHeaderMain}>
                    <p style={styles.orderId}>#{order.id.slice(0, 8)}</p>
                    <p style={styles.service}>{order.service?.name ?? "Без услуги"}</p>
                  </div>
                  <span style={{ ...styles.statusInline, ...statusPillStyle(order.status) }}>
                    {orderStatusLabel(order.status)}
                  </span>
                </div>
                <div
                  style={{
                    ...styles.metaGrid,
                    ...(isMobile ? styles.metaGridMobile : null),
                  }}
                >
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Автомобиль</span>
                    <span style={styles.metaValue}>{buildCarLabel(order)}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaLabel}>Запланировано</span>
                    <span style={styles.metaValue}>
                      {formatDateTime(order.scheduledAt) ?? "Не указано"}
                    </span>
                  </div>
                </div>

                {order.comment?.trim() ? (
                  <div style={styles.commentPreview}>
                    <span style={styles.commentLabel}>Комментарий клиента</span>
                    <p style={styles.commentText}>{order.comment.trim()}</p>
                  </div>
                ) : null}

                <div style={styles.historyCard}>
                  <span style={styles.historyTitle}>История обработки</span>
                  <div style={styles.historyList}>
                    {buildStatusHistory(order.status).map((step) => (
                      <div key={step.code} style={styles.historyItem}>
                        <span
                          style={{
                            ...styles.historyDot,
                            ...(step.done ? styles.historyDotDone : null),
                          }}
                        />
                        <span
                          style={{
                            ...styles.historyText,
                            ...(step.done ? styles.historyTextDone : null),
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                    {order.status === "CANCELLED" ? (
                      <div style={styles.historyItem}>
                        <span style={{ ...styles.historyDot, ...styles.historyDotCancelled }} />
                        <span style={{ ...styles.historyText, ...styles.historyTextCancelled }}>
                          Заказ отменён
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Итоговая цена</span>
                  <span style={styles.metaValue}>
                    {order.finalPrice != null
                      ? `${Number(order.finalPrice).toLocaleString("ru-RU")} ₽`
                      : "Ещё не выставлена мастером"}
                  </span>
                  {order.payment?.status ? (
                    <span style={styles.paymentHint}>
                      Оплата: {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
                    </span>
                  ) : null}
                </div>
              </article>
            )
          )}
          {!visibleOrders.length && !error ? (
            <p style={styles.empty}>
              {activeTab === "history"
                ? "Пока нет завершённых или отменённых заказов в истории."
                : "Пока нет активных заказов."}
            </p>
          ) : null}
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
  pageMobile: {
    padding: "20px 12px 36px",
  },
  panel: {
    maxWidth: "980px",
    margin: "0 auto",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.68)",
    padding: "24px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 24px 60px rgba(2, 6, 23, 0.24)",
  },
  panelMobile: {
    padding: "18px 14px",
    borderRadius: "18px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },
  headerMobile: {
    flexDirection: "column",
    marginBottom: "16px",
  },
  headerCopy: {
    display: "grid",
    gap: "8px",
  },
  eyebrow: {
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  title: { margin: 0, fontSize: "34px", color: "#f8fafc", lineHeight: 1.1 },
  titleMobile: { fontSize: "28px" },
  subtitle: { margin: 0, color: "#cbd5e1", maxWidth: "58ch", lineHeight: 1.6 },
  summaryCard: {
    minWidth: "150px",
    padding: "14px 16px",
    borderRadius: "16px",
    background: "rgba(30, 41, 59, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "grid",
    gap: "6px",
  },
  summaryCardMobile: {
    width: "100%",
  },
  summaryLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: "28px",
    lineHeight: 1,
  },
  error: { color: "#fca5a5", marginBottom: "14px" },
  message: { color: "#bfdbfe", marginBottom: "14px" },
  tabsRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  tabButton: {
    height: "34px",
    borderRadius: "9px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 12px",
    fontSize: "13px",
  },
  tabButtonActive: {
    background: "rgba(37, 99, 235, 0.35)",
    borderColor: "rgba(96, 165, 250, 0.8)",
    color: "#dbeafe",
  },
  list: {
    display: "grid",
    gap: "14px",
  },
  listMobile: {
    gap: "12px",
  },
  card: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(30, 41, 59, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    display: "grid",
    gap: "14px",
  },
  cardWide: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(30, 41, 59, 0.75)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    display: "grid",
    gap: "14px",
  },
  cardMobile: {
    padding: "16px",
    borderRadius: "16px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  cardHeaderMain: {
    display: "grid",
    gap: "6px",
  },
  serviceTitle: { color: "#e2e8f0", fontSize: "20px", lineHeight: 1.3 },
  serviceDescription: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#94a3b8",
  },
  orderId: {
    margin: 0,
    color: "#93c5fd",
    fontWeight: 700,
    fontSize: "13px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  service: { margin: 0, color: "#e2e8f0", fontSize: "18px", fontWeight: 600, lineHeight: 1.35 },
  status: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  statusInline: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  metaGridMobile: {
    gridTemplateColumns: "1fr",
  },
  metaItem: {
    display: "grid",
    gap: "4px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(15, 23, 42, 0.46)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  metaValue: {
    color: "#e2e8f0",
    lineHeight: 1.45,
    fontSize: "14px",
  },
  detailsToggle: {
    borderTop: "1px solid rgba(148, 163, 184, 0.14)",
    paddingTop: "12px",
  },
  detailsSummary: {
    cursor: "pointer",
    color: "#93c5fd",
    fontWeight: 600,
    fontSize: "14px",
    listStyle: "none",
  },
  detailsContent: {
    marginTop: "12px",
  },
  actionsRow: {
    display: "flex",
    justifyContent: "flex-start",
  },
  primaryButton: {
    height: "40px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    padding: "0 14px",
  },
  commentPreview: {
    display: "grid",
    gap: "6px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(15, 23, 42, 0.42)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
  },
  commentLabel: {
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 700,
  },
  commentText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.55,
    fontSize: "14px",
    whiteSpace: "pre-wrap",
  },
  historyCard: {
    display: "grid",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(15, 23, 42, 0.42)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
  },
  historyTitle: {
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 700,
  },
  historyList: {
    display: "grid",
    gap: "7px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  historyDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.45)",
    flexShrink: 0,
  },
  historyDotDone: {
    background: "#60a5fa",
    boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.12)",
  },
  historyDotCancelled: {
    background: "#fca5a5",
    boxShadow: "0 0 0 4px rgba(252, 165, 165, 0.12)",
  },
  historyText: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: 1.4,
  },
  historyTextDone: {
    color: "#dbeafe",
  },
  historyTextCancelled: {
    color: "#fecaca",
  },
  paymentHint: {
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "4px",
  },
  empty: { margin: 0, color: "#94a3b8" },
};
