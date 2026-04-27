import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { createAssignment, getActiveAssignments } from "../../../features/assignments";
import { getMastersAnalytics, getOrdersAnalytics, getRevenueAnalytics } from "../../../features/analytics";
import { approvePrice, getOrders, sendInvoice } from "../../../features/orders";
import { getAccessToken } from "../../../shared/api/axiosClient";
import { getApiOrigin } from "../../../shared/lib/apiOrigin";
import { getAuthUser } from "../../../shared/lib/auth";
import { orderStatusLabel } from "../../../shared/lib/orderStatus";
import { createMaster, getMasters } from "../../../features/users";

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(
    Number(value ?? 0)
  );
}

function formatClockTime(timestamp) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(timestamp));
}

const ANALYTICS_PERIODS = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "all", label: "За всё время" }
];

function RevenueChart({ points }) {
  if (!points.length) {
    return <p style={styles.empty}>Нет данных по выручке за выбранный период.</p>;
  }

  const width = 600;
  const height = 180;
  const padding = 24;
  const maxRevenue = Math.max(...points.map((point) => Number(point.revenue ?? 0)), 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const innerHeight = height - padding * 2;

  const chartPoints = points
    .map((point, index) => {
      const x = padding + index * stepX;
      const ratio = Number(point.revenue ?? 0) / maxRevenue;
      const y = height - padding - ratio * innerHeight;
      return { ...point, x, y };
    });

  const pathD = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - padding - ratio * innerHeight;
    const value = maxRevenue * ratio;
    return { y, value };
  });

  return (
    <div style={styles.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} style={styles.chartSvg} role="img" aria-label="График выручки">
        {gridLines.map((line) => (
          <g key={line.y}>
            <line x1={padding} y1={line.y} x2={width - padding} y2={line.y} stroke="rgba(148,163,184,0.2)" />
            <text x={8} y={line.y + 4} fill="#94a3b8" fontSize="10">
              {Math.round(line.value)}
            </text>
          </g>
        ))}
        <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        {chartPoints.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="4" fill="#bfdbfe">
            <title>
              {point.date}: {formatMoney(point.revenue)}
            </title>
          </circle>
        ))}
      </svg>
      <div style={styles.chartLegend}>
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}

export function OwnerPage() {
  const [orders, setOrders] = useState([]);
  const [masters, setMasters] = useState([]);
  const [analytics, setAnalytics] = useState({
    revenue: null,
    masters: null,
    orders: null
  });
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [lastLocations, setLastLocations] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [masterForm, setMasterForm] = useState({ name: "", phone: "", email: "", password: "" });
  const reloadDataRef = useRef(async () => {});

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === "PENDING" && !order.assignment), [orders]);
  const waitingApproveOrders = useMemo(
    () => orders.filter((order) => order.payment?.status === "AWAITING_FINAL" && !order.priceApproved),
    [orders]
  );
  const waitingInvoiceOrders = useMemo(
    () => orders.filter((order) => order.payment?.status === "AWAITING_FINAL" && order.priceApproved),
    [orders]
  );

  async function reloadData(period = analyticsPeriod) {
    setAnalyticsLoading(true);
    try {
      const [ordersResult, mastersResult, revenueResult, mastersAnalyticsResult, ordersAnalyticsResult] = await Promise.all([
        getOrders(),
        getMasters(),
        getRevenueAnalytics(period),
        getMastersAnalytics(period),
        getOrdersAnalytics(period)
      ]);
      setOrders(ordersResult.data);
      setMasters(mastersResult.data);
      setAnalytics({
        revenue: revenueResult.data,
        masters: mastersAnalyticsResult.data,
        orders: ordersAnalyticsResult.data
      });
      try {
        const activeResult = await getActiveAssignments();
        setActiveAssignments(activeResult.data);
      } catch {
        setActiveAssignments([]);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }

  reloadDataRef.current = reloadData;

  useEffect(() => {
    reloadData().catch(() => {
      setMessage("Не удалось загрузить данные owner панели.");
    });
  }, [analyticsPeriod]);

  useEffect(() => {
    if (getAuthUser()?.role !== "OWNER") {
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
    const onConnect = () => {
      setSocketConnected(true);
      socket.emit("join:owner", {}, () => {});
    };
    const onDisconnect = () => {
      setSocketConnected(false);
    };
    const refresh = () => {
      void reloadDataRef.current();
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("order:status", refresh);
    socket.on("order:price", refresh);
    socket.on("master:location", (payload) => {
      if (payload?.assignmentId) {
        setLastLocations((prev) => ({
          ...prev,
          [payload.assignmentId]: { lat: payload.lat, lng: payload.lng, at: Date.now() }
        }));
      }
      refresh();
    });
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.close();
    };
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
      setMessage("Цена подтверждена. Теперь отправьте счёт клиенту.");
      await reloadData();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Ошибка подтверждения цены.");
    }
  };

  const onSendInvoice = async (orderId) => {
    try {
      await sendInvoice(orderId);
      setMessage("Счёт отправлен клиенту.");
      await reloadData();
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Ошибка отправки счёта.");
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

          <div style={styles.orderWorkflowGrid}>
            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Шаг 1. Ожидают назначения</h2>
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
            <h2 style={styles.sectionTitle}>Мониторинг выездов мастеров</h2>
            <p style={styles.socketHint}>
              Статус realtime: {socketConnected ? "подключено" : "не подключено"}.
              {socketConnected
                ? " Карточки ниже обновляются автоматически."
                : " Пока нет онлайн-обновлений, проверьте подключение."}
            </p>
            <div style={styles.list}>
              {activeAssignments.map((row) => {
                const loc = lastLocations[row.id];
                const coordsSource = row.gpsLat != null && row.gpsLng != null ? "по GPS мастера" : "из адреса заказа";
                const lat = loc?.lat ?? row.gpsLat;
                const lng = loc?.lng ?? row.gpsLng;
                const hasCoords = lat != null && lng != null;
                const mapUrl = hasCoords ? `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map` : null;
                return (
                  <article key={row.id} style={styles.assignmentCard}>
                    <p style={styles.assignmentTitle}>
                      {row.master?.name ?? "Мастер"} · {orderStatusLabel(row.order?.status)}
                    </p>
                    <p style={styles.assignmentMeta}>
                      Заказ: #{row.orderId?.slice(0, 8)} · {row.order?.serviceId ? "услуга назначена" : "без услуги"}
                    </p>
                    <p style={styles.assignmentMeta}>
                      Координаты:{" "}
                      {hasCoords ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "координаты пока не получены"}
                    </p>
                    <p style={styles.assignmentMeta}>
                      Источник: {coordsSource} · последнее обновление: {formatClockTime(loc?.at)}
                    </p>
                    {mapUrl ? (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={styles.coordLink}>
                        Открыть на карте
                      </a>
                    ) : null}
                  </article>
                );
              })}
              {!activeAssignments.length ? <p style={styles.empty}>Нет активных выездов (ASSIGNED / EN_ROUTE / IN_PROGRESS).</p> : null}
            </div>
          </section>

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Шаг 2. Ожидают подтверждения цены</h2>
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

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>Шаг 3. Ожидают отправки счёта</h2>
              <div style={styles.list}>
                {waitingInvoiceOrders.map((order) => (
                  <article key={order.id} style={styles.item}>
                    <span>
                      #{order.id.slice(0, 8)} - {order.service?.name} - сумма:{" "}
                      {order.finalPrice ?? order.payment?.finalAmount ?? "-"}
                    </span>
                    <button type="button" style={styles.secondaryButton} onClick={() => onSendInvoice(order.id)}>
                      Отправить счёт
                    </button>
                  </article>
                ))}
                {!waitingInvoiceOrders.length ? <p style={styles.empty}>Нет счетов для отправки.</p> : null}
              </div>
            </section>
          </div>

          <section style={styles.card}>
            <h2 style={styles.sectionTitle}>Аналитика</h2>
            <div style={styles.periodSwitch}>
              {ANALYTICS_PERIODS.map((period) => (
                <button
                  key={period.value}
                  type="button"
                  style={{
                    ...styles.periodButton,
                    ...(analyticsPeriod === period.value ? styles.periodButtonActive : null)
                  }}
                  onClick={() => setAnalyticsPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <p style={styles.periodMeta}>
              Период: {ANALYTICS_PERIODS.find((item) => item.value === analyticsPeriod)?.label}
              {analyticsLoading ? " · обновление..." : ""}
            </p>
            <div style={styles.analyticsGrid}>
              <article style={styles.analyticsItem}>
                <span style={styles.analyticsLabel}>Выручка</span>
                <strong style={styles.analyticsValue}>{formatMoney(analytics.revenue?.totals?.totalRevenue)}</strong>
              </article>
              <article style={styles.analyticsItem}>
                <span style={styles.analyticsLabel}>Заказов</span>
                <strong style={styles.analyticsValue}>{analytics.orders?.totalOrders ?? 0}</strong>
              </article>
              <article style={styles.analyticsItem}>
                <span style={styles.analyticsLabel}>Мастеров</span>
                <strong style={styles.analyticsValue}>{analytics.masters?.totals?.mastersCount ?? 0}</strong>
              </article>
            </div>
            <RevenueChart points={analytics.revenue?.timeline ?? []} />
            <div style={styles.list}>
              {(analytics.orders?.byStatus ?? []).map((item) => (
                <article key={item.status} style={styles.item}>
                  <span>Статус: {orderStatusLabel(item.status)}</span>
                  <strong>{item.count}</strong>
                </article>
              ))}
              {!analytics.orders?.byStatus?.length ? <p style={styles.empty}>Пока нет данных по статусам.</p> : null}
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
  orderWorkflowGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
    alignItems: "start"
  },
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
  assignmentCard: {
    display: "grid",
    gap: "6px",
    padding: "10px",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.18)"
  },
  assignmentTitle: { margin: 0, color: "#e2e8f0", fontWeight: 600 },
  assignmentMeta: { margin: 0, color: "#94a3b8", fontSize: "13px", lineHeight: 1.4 },
  coordLink: { color: "#93c5fd", textDecoration: "underline", fontSize: "13px" },
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
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "10px"
  },
  analyticsItem: {
    display: "grid",
    gap: "6px",
    padding: "10px",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.18)"
  },
  analyticsLabel: {
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  },
  analyticsValue: {
    fontSize: "22px",
    color: "#f8fafc"
  },
  periodSwitch: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px"
  },
  periodButton: {
    height: "32px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    borderRadius: "8px",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    cursor: "pointer",
    padding: "0 10px",
    fontSize: "13px"
  },
  periodButtonActive: {
    background: "rgba(37, 99, 235, 0.35)",
    borderColor: "rgba(96, 165, 250, 0.8)",
    color: "#dbeafe"
  },
  chartWrap: {
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "10px",
    background: "rgba(15, 23, 42, 0.55)",
    border: "1px solid rgba(148, 163, 184, 0.18)"
  },
  chartSvg: {
    width: "100%",
    height: "180px",
    display: "block"
  },
  chartLegend: {
    display: "flex",
    justifyContent: "space-between",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "6px"
  },
  periodMeta: {
    margin: "0 0 10px",
    color: "#94a3b8",
    fontSize: "13px"
  },
  socketHint: { margin: "0 0 10px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }
};
