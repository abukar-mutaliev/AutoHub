import { useEffect, useState } from "react";
import { createOrder } from "../../../features/orders";
import { getServices } from "../../../features/services";

function emptyOrderForm() {
  return {
    serviceId: "",
    carBrand: "",
    carModel: "",
    carYear: new Date().getFullYear(),
    address: "",
    comment: ""
  };
}

const PRICE_TYPE_LABELS = {
  FIXED: "Фиксированная цена",
  ESTIMATED: "Оценочный диапазон",
  ON_SITE: "По результатам на месте"
};

function formatRub(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : Number(value);
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(n);
}

function formatPriceBlock(service) {
  const lines = [];
  const { priceType, price, priceMin, priceMax } = service;

  if (priceType === "FIXED") {
    const p = formatRub(price);
    lines.push({ label: "Цена работ", value: p ?? "—" });
  }
  if (priceType === "ESTIMATED") {
    const min = formatRub(priceMin);
    const max = formatRub(priceMax);
    if (min && max) lines.push({ label: "Диапазон", value: `${min} — ${max}` });
    else if (min) lines.push({ label: "От", value: min });
    else if (max) lines.push({ label: "До", value: max });
    else lines.push({ label: "Диапазон", value: "—" });
  }
  if (priceType === "ON_SITE") {
    lines.push({
      label: "Стоимость",
      value: "Определяется после осмотра"
    });
  }

  if (service.calloutFee != null && service.calloutFee !== "") {
    const callout = formatRub(service.calloutFee);
    lines.push({
      label: "Выезд / подъезд",
      value:
        Number(service.calloutFee) === 0 ? "Бесплатно" : callout ?? "—"
    });
  } else {
    lines.push({ label: "Выезд / подъезд", value: "—" });
  }

  return lines;
}

export function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyOrderForm);

  useEffect(() => {
    getServices()
      .then((result) => {
        setServices(result.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!form.serviceId.trim()) {
      setMessage("Выберите услугу на карточке выше.");
      return;
    }
    if (!form.carBrand.trim() || !form.carModel.trim()) {
      setMessage("Укажите марку и модель автомобиля.");
      return;
    }
    try {
      await createOrder({
        ...form,
        carYear: Number(form.carYear)
      });
      setMessage("Заказ создан.");
      setForm(emptyOrderForm());
    } catch (error) {
      setMessage(error.response?.data?.error?.message ?? "Не удалось создать заказ.");
    }
  };

  const selectedService = services.find((s) => s.id === form.serviceId);

  return (
    <main style={styles.page}>
      <section style={styles.intro}>
        <h2 style={styles.pageTitle}>Услуги</h2>
        <p style={styles.lead}>
          Выберите услугу на карточке ниже — в форме заказа отобразится её название. Указаны актуальные цены и
          условия выезда.
        </p>
      </section>

      {loading ? (
        <p style={styles.muted}>Загрузка...</p>
      ) : (
        <div style={styles.grid}>
          {services.map((service) => {
            const isSelected = form.serviceId === service.id;
            const priceLines = formatPriceBlock(service);
            return (
              <article
                key={service.id}
                style={{
                  ...styles.card,
                  ...(isSelected ? styles.cardSelected : {})
                }}
              >
                <header style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{service.name}</h3>
                  <div style={styles.badges}>
                    {service.isMobile ? (
                      <span style={styles.badgeAccent}>Выездной сервис</span>
                    ) : (
                      <span style={styles.badgeMuted}>В сервисе</span>
                    )}
                    <span style={styles.badgeOutline}>{PRICE_TYPE_LABELS[service.priceType] ?? service.priceType}</span>
                  </div>
                </header>

                <p style={styles.description}>
                  {service.description?.trim() ? service.description : "Описание пока не добавлено."}
                </p>

                <dl style={styles.details}>
                  {priceLines.map((row) => (
                    <div key={row.label} style={styles.detailRow}>
                      <dt style={styles.dt}>{row.label}</dt>
                      <dd style={styles.dd}>{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  style={{
                    ...styles.cardButton,
                    ...(isSelected ? styles.cardButtonActive : {})
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, serviceId: service.id }))}
                >
                  {isSelected ? "Выбрано для заказа" : "Выбрать для заказа"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <section style={styles.formSection}>
        <h3 style={styles.formTitle}>Создать заказ</h3>
        {selectedService ? (
          <div style={styles.selectedService} aria-live="polite">
            <span style={styles.selectedServiceLabel}>Выбранная услуга</span>
            <span style={styles.selectedServiceName}>{selectedService.name}</span>
          </div>
        ) : (
          <p style={styles.formHint}>Выберите услугу на карточке выше.</p>
        )}
        <form onSubmit={onSubmit} style={styles.form}>
          <input
            placeholder="Марка авто"
            value={form.carBrand}
            onChange={(e) => setForm((p) => ({ ...p, carBrand: e.target.value }))}
            style={styles.input}
          />
          <input
            placeholder="Модель авто"
            value={form.carModel}
            onChange={(e) => setForm((p) => ({ ...p, carModel: e.target.value }))}
            style={styles.input}
          />
          <input
            placeholder="Год авто"
            type="number"
            value={form.carYear}
            onChange={(e) => setForm((p) => ({ ...p, carYear: e.target.value }))}
            style={styles.input}
          />
          <input
            placeholder="Адрес"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            style={styles.input}
          />
          <input
            placeholder="Комментарий"
            value={form.comment}
            onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
            style={styles.input}
          />
          <button type="submit" style={styles.submit}>
            Отправить заказ
          </button>
        </form>
        {message ? <p style={styles.message}>{message}</p> : null}
      </section>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "8px 0 48px",
    display: "grid",
    gap: "28px"
  },
  intro: {
    borderRadius: "16px",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.22)"
  },
  pageTitle: {
    margin: "0 0 8px",
    fontSize: "28px",
    color: "#f8fafc"
  },
  lead: {
    margin: 0,
    maxWidth: "72ch",
    lineHeight: 1.55,
    color: "#cbd5e1",
    fontSize: "15px"
  },
  muted: {
    color: "#94a3b8"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px"
  },
  card: {
    borderRadius: "16px",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  },
  cardSelected: {
    borderColor: "rgba(59, 130, 246, 0.65)",
    boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.35)"
  },
  cardHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  cardTitle: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.35,
    color: "#f1f5f9"
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  badgeAccent: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(34, 197, 94, 0.18)",
    color: "#bbf7d0",
    border: "1px solid rgba(74, 222, 128, 0.35)"
  },
  badgeMuted: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(148, 163, 184, 0.15)",
    color: "#e2e8f0",
    border: "1px solid rgba(148, 163, 184, 0.28)"
  },
  badgeOutline: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "999px",
    color: "#93c5fd",
    border: "1px solid rgba(96, 165, 250, 0.45)",
    background: "rgba(37, 99, 235, 0.12)"
  },
  description: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.55,
    color: "#cbd5e1",
    flex: 1
  },
  details: {
    margin: 0,
    display: "grid",
    gap: "10px"
  },
  detailRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "4px"
  },
  dt: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 500,
    lineHeight: 1.35
  },
  dd: {
    margin: 0,
    fontSize: "14px",
    color: "#e2e8f0",
    fontWeight: 600,
    lineHeight: 1.45,
    textAlign: "left",
    wordBreak: "break-word"
  },
  cardButton: {
    marginTop: "4px",
    cursor: "pointer",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: 600,
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(30, 41, 59, 0.9)",
    color: "#e2e8f0",
    transition: "background 0.15s ease, border-color 0.15s ease"
  },
  cardButtonActive: {
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    borderColor: "transparent",
    color: "#ffffff"
  },
  formSection: {
    borderRadius: "16px",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.2)"
  },
  formTitle: {
    margin: "0 0 8px",
    color: "#f8fafc",
    fontSize: "20px"
  },
  selectedService: {
    marginBottom: "16px",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(59, 130, 246, 0.35)",
    display: "grid",
    gap: "6px"
  },
  selectedServiceLabel: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#94a3b8"
  },
  selectedServiceName: {
    fontSize: "17px",
    fontWeight: 600,
    color: "#f8fafc",
    lineHeight: 1.35
  },
  formHint: {
    margin: "0 0 16px",
    color: "#94a3b8",
    fontSize: "14px"
  },
  form: {
    display: "grid",
    gap: "12px",
    maxWidth: "420px"
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(2, 6, 23, 0.5)",
    color: "#f1f5f9"
  },
  submit: {
    padding: "11px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    border: "none",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#ffffff"
  },
  message: {
    marginTop: "12px",
    color: "#bae6fd"
  }
};
