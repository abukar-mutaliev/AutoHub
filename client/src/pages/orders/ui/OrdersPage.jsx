import { useEffect, useMemo, useState } from "react";
import { getOrders } from "../../../features/orders";
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

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 1280;
    }

    return window.innerWidth;
  });

  const role = useMemo(() => getAuthUser()?.role ?? null, []);
  const detailCards = role === "OWNER" || role === "MASTER";
  const isMobile = viewportWidth <= 768;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getOrders()
      .then((result) => setOrders(result.data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error?.message ?? "Не удалось загрузить заказы");
      });
  }, []);

  return (
    <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : null) }}>
      <section style={{ ...styles.panel, ...(isMobile ? styles.panelMobile : null) }}>
        <div style={{ ...styles.header, ...(isMobile ? styles.headerMobile : null) }}>
          <div style={styles.headerCopy}>
            <span style={styles.eyebrow}>Заказы</span>
            <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : null) }}>Мои заказы</h1>
            <p style={styles.subtitle}>
              Отслеживайте текущий статус заявок и быстро переходите к важным деталям без
              перегруженных карточек.
            </p>
          </div>
          <div style={{ ...styles.summaryCard, ...(isMobile ? styles.summaryCardMobile : null) }}>
            <span style={styles.summaryLabel}>Всего заявок</span>
            <strong style={styles.summaryValue}>{orders.length}</strong>
          </div>
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}
        <div style={{ ...styles.list, ...(isMobile ? styles.listMobile : null) }}>
          {orders.map((order) =>
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
                  <span style={styles.status}>{orderStatusLabel(order.status)}</span>
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
                  <span style={styles.statusInline}>{orderStatusLabel(order.status)}</span>
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
              </article>
            )
          )}
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
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  statusInline: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
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
  empty: { margin: 0, color: "#94a3b8" },
};
