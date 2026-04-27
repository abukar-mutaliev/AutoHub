const PRICE_TYPE_LABELS = {
  FIXED: "Фиксированная цена",
  ESTIMATED: "Оценочный диапазон",
  ON_SITE: "По результатам на месте"
};

const PAYMENT_STATUS_LABELS = {
  PENDING: "Ожидает оплаты выезда",
  CALLOUT_PAID: "Выезд оплачен",
  AWAITING_FINAL: "Ожидает итоговую оплату",
  FINAL_SENT: "Итоговая сумма отправлена владельцу",
  COMPLETED: "Оплачено полностью",
  REFUNDED: "Возврат"
};

export function formatRub(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : Number(value);
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(n);
}

export function formatDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}

export function workPriceHint(order) {
  const { priceType, estimatedMin, estimatedMax, service } = order;
  if (priceType === "ON_SITE") {
    return "Определяется после осмотра";
  }
  if (priceType === "ESTIMATED") {
    const min = formatRub(estimatedMin);
    const max = formatRub(estimatedMax);
    if (min && max) return `${min} — ${max}`;
    if (min) return `от ${min}`;
    if (max) return `до ${max}`;
    return "—";
  }
  if (priceType === "FIXED") {
    return formatRub(service?.price) ?? formatRub(estimatedMin) ?? "—";
  }
  return "—";
}

function mapsHref(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=16&l=map`;
}

function DetailRow({ label, children }) {
  return (
    <div style={detailStyles.detailRow}>
      <span style={detailStyles.detailLabel}>{label}</span>
      <span style={detailStyles.detailValue}>{children}</span>
    </div>
  );
}

export function OrderDetailSections({ order, showMasterSection = true, hideClientPhone = false }) {
  const coords = mapsHref(order.geoLat, order.geoLng);
  const payment = order.payment;
  const masterName = order.assignment?.master?.name;

  return (
    <div style={detailStyles.details}>
      {showMasterSection ? (
        <div style={detailStyles.detailSection}>
          <h2 style={detailStyles.sectionTitle}>Мастер</h2>
          <DetailRow label="Назначен">{masterName ?? "Пока не назначен"}</DetailRow>
          <DetailRow label="Взял в работу">
            {masterName && order.assignedAt
              ? `${masterName}, ${formatDateTime(order.assignedAt)}`
              : "Ещё не взят в работу"}
          </DetailRow>
        </div>
      ) : null}

      <div style={detailStyles.detailSection}>
        <h2 style={detailStyles.sectionTitle}>История статусов</h2>
        <DetailRow label="Создан">{formatDateTime(order.pendingAt ?? order.createdAt) ?? "—"}</DetailRow>
        <DetailRow label="Назначен мастеру">{formatDateTime(order.assignedAt) ?? "—"}</DetailRow>
        <DetailRow label="Мастер в пути">{formatDateTime(order.enRouteAt) ?? "—"}</DetailRow>
        <DetailRow label="В работе">{formatDateTime(order.inProgressAt) ?? "—"}</DetailRow>
        <DetailRow label="Завершён">{formatDateTime(order.doneAt) ?? "—"}</DetailRow>
        <DetailRow label="Отменён">{formatDateTime(order.cancelledAt) ?? "—"}</DetailRow>
      </div>

      <div style={detailStyles.detailSection}>
        <h2 style={detailStyles.sectionTitle}>Автомобиль</h2>
        <DetailRow label="Марка">{order.carBrand}</DetailRow>
        <DetailRow label="Модель">{order.carModel}</DetailRow>
        <DetailRow label="Год выпуска">{order.carYear}</DetailRow>
      </div>

      <div style={detailStyles.detailSection}>
        <h2 style={detailStyles.sectionTitle}>Клиент</h2>
        <DetailRow label="Имя">{order.client?.name ?? "—"}</DetailRow>
        <DetailRow label="Телефон">
          {hideClientPhone ? (
            "Скрыто платформой (для мастера телефон недоступен)"
          ) : order.client?.phone ? (
            <a href={`tel:${order.client.phone}`} style={detailStyles.link}>
              {order.client.phone}
            </a>
          ) : (
            "—"
          )}
        </DetailRow>
      </div>

      <div style={detailStyles.detailSection}>
        <h2 style={detailStyles.sectionTitle}>Адрес и время</h2>
        <DetailRow label="Адрес">{order.address?.trim() ? order.address : "Не указан"}</DetailRow>
        {coords ? (
          <DetailRow label="Карта">
            <a href={coords} target="_blank" rel="noopener noreferrer" style={detailStyles.link}>
              Открыть координаты на карте
            </a>
          </DetailRow>
        ) : null}
        <DetailRow label="Создан">{formatDateTime(order.createdAt) ?? "—"}</DetailRow>
        <DetailRow label="Запланировано">{formatDateTime(order.scheduledAt) ?? "Не указано"}</DetailRow>
      </div>

      {order.comment?.trim() ? (
        <div style={detailStyles.detailSection}>
          <h2 style={detailStyles.sectionTitle}>Комментарий клиента</h2>
          <p style={detailStyles.comment}>{order.comment.trim()}</p>
        </div>
      ) : null}

      <div style={detailStyles.detailSection}>
        <h2 style={detailStyles.sectionTitle}>Условия и суммы</h2>
        <DetailRow label="Номер заказа">
          <span style={detailStyles.mono}>{order.id}</span>
        </DetailRow>
        <DetailRow label="Тип расчёта">{PRICE_TYPE_LABELS[order.priceType] ?? order.priceType}</DetailRow>
        <DetailRow label="Ориентир по работам">{workPriceHint(order)}</DetailRow>
        <DetailRow label="Выезд / подъезд">
          {order.calloutFee != null && order.calloutFee !== "" && Number(order.calloutFee) !== 0
            ? formatRub(order.calloutFee) ?? "—"
            : "Бесплатно / не указано"}
        </DetailRow>
        <DetailRow label="Итог от мастера">
          {order.finalPrice != null && order.finalPrice !== ""
            ? formatRub(order.finalPrice)
            : "Ещё не отправлена"}
        </DetailRow>
        <DetailRow label="Владелец согласовал цену">{order.priceApproved ? "Да" : "Нет"}</DetailRow>
      </div>

      {payment ? (
        <div style={detailStyles.detailSection}>
          <h2 style={detailStyles.sectionTitle}>Оплата</h2>
          <DetailRow label="Статус">{PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}</DetailRow>
          <DetailRow label="Выезд (платёж)">{formatRub(payment.calloutAmount) ?? "—"}</DetailRow>
          <DetailRow label="Итог в платежах">{formatRub(payment.finalAmount) ?? "—"}</DetailRow>
          <DetailRow label="Выезд оплачен">{formatDateTime(payment.calloutPaidAt) ?? "—"}</DetailRow>
          <DetailRow label="Итог оплачен">{formatDateTime(payment.finalPaidAt) ?? "—"}</DetailRow>
        </div>
      ) : null}

      {order.assignment?.notes?.trim() ? (
        <div style={detailStyles.detailSection}>
          <h2 style={detailStyles.sectionTitle}>Заметки по заявке</h2>
          <p style={detailStyles.comment}>{order.assignment.notes.trim()}</p>
        </div>
      ) : null}
    </div>
  );
}

const detailStyles = {
  details: {
    display: "grid",
    gap: "14px",
    marginBottom: "14px",
    paddingTop: "4px",
    borderTop: "1px solid rgba(148, 163, 184, 0.15)",
  },
  detailSection: {
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "minmax(120px, 180px) 1fr",
    gap: "8px 12px",
    alignItems: "start",
    fontSize: "14px",
    lineHeight: 1.45,
    marginBottom: "6px",
  },
  detailLabel: { color: "#94a3b8" },
  detailValue: { color: "#e2e8f0", wordBreak: "break-word" },
  mono: { fontFamily: 'ui-monospace, "Cascadia Code", monospace', fontSize: "12px", color: "#cbd5e1" },
  link: { color: "#93c5fd", textDecoration: "underline" },
  comment: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#cbd5e1",
  },
};
