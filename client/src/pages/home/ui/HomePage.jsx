import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../../../app/providers/session-context";
import { getAccessToken } from "../../../shared/api/axiosClient";
import { routes } from "../../../shared/config/routes";
import { getAuthUser } from "../../../shared/lib/auth";

export function HomePage() {
  const { sessionTick } = useSession();
  void sessionTick;

  const isAuthenticated = Boolean(getAccessToken());
  const user = getAuthUser();
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 1280;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTablet = viewportWidth <= 1024;
  const isMobile = viewportWidth <= 768;
  const isCompact = viewportWidth <= 560;

  const quickLinks = [];
  if (!isAuthenticated) {
    quickLinks.push({
      to: routes.login,
      label: "Войти",
      description: "Откройте доступ к истории заявок и персональным предложениям.",
    });
    quickLinks.push({
      to: routes.register,
      label: "Регистрация",
      description: "Создайте аккаунт и оформляйте выезд в пару кликов.",
    });
  }
  quickLinks.push(
    {
      to: routes.services,
      label: "Каталог услуг",
      description: "Сравните услуги, сроки и выберите подходящий формат ремонта.",
    },
    {
      to: routes.orders,
      label: "Мои заказы",
      description: "Следите за этапами обслуживания и статусом мастера онлайн.",
    }
  );
  if (user?.role === "OWNER") {
    quickLinks.push({
      to: routes.ownerPanel,
      label: "Панель владельца",
      description: "Контролируйте заявки, мастеров и загрузку сервиса в одном месте.",
    });
  }
  if (user?.role === "MASTER") {
    quickLinks.push({
      to: routes.masterPanel,
      label: "Панель мастера",
      description: "Получайте новые выезды, обновляйте статусы и ведите клиентов.",
    });
  }

  const features = [
    {
      title: "Быстрый выезд",
      description: "Мастер приезжает в удобное для вас место и время.",
    },
    {
      title: "Прозрачная стоимость",
      description: "Фиксируем цену работ до выезда без скрытых платежей.",
    },
    {
      title: "Онлайн-контроль",
      description: "Отслеживайте статус заявки и общайтесь с мастером в одном окне.",
    },
  ];

  const trustMetrics = [
    { value: "15 мин", label: "среднее время подтверждения" },
    { value: "24/7", label: "приём заявок без звонков" },
    { value: "100%", label: "прозрачность этапов и стоимости" },
  ];

  const serviceFlow = [
    {
      step: "01",
      title: "Оставляете заявку",
      description: "Выбираете услугу, адрес и удобное время выезда прямо на сайте.",
    },
    {
      step: "02",
      title: "Получаете подтверждение",
      description: "Фиксируем объём работ, стоимость и назначаем свободного мастера.",
    },
    {
      step: "03",
      title: "Контролируете процесс",
      description: "Смотрите статусы заказа и остаётесь на связи до завершения обслуживания.",
    },
  ];

  const heroHighlights = [
    "Выезд по городу и области",
    "Прозрачные этапы заявки",
    "Поддержка клиентов онлайн",
  ];

  return (
    <main style={{ ...styles.page, ...(isMobile ? styles.pageMobile : null) }}>
      <section style={{ ...styles.hero, ...(isMobile ? styles.heroMobile : null) }}>
        <div style={styles.heroGlow} />
        <div
          style={{
            ...styles.heroContent,
            ...(isTablet ? styles.heroContentTablet : null),
            ...(isMobile ? styles.heroContentMobile : null),
          }}
        >
          <div style={styles.heroMain}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>AutoHub</span>
              <span style={{ ...styles.badgeNote, ...(isMobile ? styles.badgeNoteMobile : null) }}>
                Выездной сервис нового поколения
              </span>
            </div>
            <h1 style={{ ...styles.title, ...(isMobile ? styles.titleMobile : null) }}>
              Современный выездной автосервис без ожидания в очередях
            </h1>
            <p style={{ ...styles.subtitle, ...(isMobile ? styles.subtitleMobile : null) }}>
              Создавайте заявку за минуту, выбирайте удобное время и контролируйте
              обслуживание автомобиля онлайн.
            </p>

            <div
              style={{
                ...styles.heroHighlights,
                ...(isMobile ? styles.heroHighlightsMobile : null),
              }}
            >
              {heroHighlights.map((item) => (
                <span
                  key={item}
                  style={{
                    ...styles.heroHighlight,
                    ...(isCompact ? styles.heroHighlightCompact : null),
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div
              style={{
                ...styles.primaryActions,
                ...(isMobile ? styles.primaryActionsMobile : null),
              }}
            >
              <Link
                to={isAuthenticated ? routes.services : routes.register}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  ...(isMobile ? styles.buttonMobile : null),
                }}
              >
                Оставить заявку
              </Link>
              <Link
                to={routes.services}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  ...(isMobile ? styles.buttonMobile : null),
                }}
              >
                Посмотреть услуги
              </Link>
            </div>

            <div
              style={{
                ...styles.metricsGrid,
                ...(isMobile ? styles.metricsGridMobile : null),
              }}
            >
              {trustMetrics.map((metric) => (
                <article
                  key={metric.label}
                  style={{
                    ...styles.metricCard,
                    ...(isCompact ? styles.metricCardCompact : null),
                  }}
                >
                  <strong
                    style={{ ...styles.metricValue, ...(isMobile ? styles.metricValueMobile : null) }}
                  >
                    {metric.value}
                  </strong>
                  <span
                    style={{ ...styles.metricLabel, ...(isMobile ? styles.metricLabelMobile : null) }}
                  >
                    {metric.label}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <aside
            style={{
              ...styles.heroAside,
              ...(isMobile ? styles.heroAsideMobile : null),
            }}
          >
            <div
              style={{
                ...styles.previewCard,
                ...(isMobile ? styles.previewCardMobile : null),
              }}
            >
              <div style={styles.previewHeader}>
                <span style={{ ...styles.previewBadge, ...(isMobile ? styles.previewBadgeMobile : null) }}>
                  Заявка активна
                </span>
                <span style={{ ...styles.previewMeta, ...(isMobile ? styles.previewMetaMobile : null) }}>
                  Сегодня, 14:30
                </span>
              </div>

              <div style={styles.previewRoute}>
                <div>
                  <p style={{ ...styles.previewLabel, ...(isMobile ? styles.previewLabelMobile : null) }}>
                    Услуга
                  </p>
                  <strong style={{ ...styles.previewValue, ...(isMobile ? styles.previewValueMobile : null) }}>
                    Диагностика и запуск двигателя
                  </strong>
                </div>
                <div>
                  <p style={{ ...styles.previewLabel, ...(isMobile ? styles.previewLabelMobile : null) }}>
                    Локация
                  </p>
                  <strong style={{ ...styles.previewValue, ...(isMobile ? styles.previewValueMobile : null) }}>
                    Выезд к клиенту за 35 минут
                  </strong>
                </div>
              </div>

              <div style={styles.timeline}>
                <div style={styles.timelineItem}>
                  <span style={{ ...styles.timelineDot, ...styles.timelineDotActive }} />
                  <div>
                    <p style={{ ...styles.timelineTitle, ...(isMobile ? styles.timelineTitleMobile : null) }}>
                      Заявка подтверждена
                    </p>
                    <p style={{ ...styles.timelineText, ...(isMobile ? styles.timelineTextMobile : null) }}>
                      Стоимость и время приезда уже зафиксированы.
                    </p>
                  </div>
                </div>
                <div style={styles.timelineItem}>
                  <span style={styles.timelineDot} />
                  <div>
                    <p style={{ ...styles.timelineTitle, ...(isMobile ? styles.timelineTitleMobile : null) }}>
                      Мастер в пути
                    </p>
                    <p style={{ ...styles.timelineText, ...(isMobile ? styles.timelineTextMobile : null) }}>
                      Вы видите следующий этап и остаетесь на связи.
                    </p>
                  </div>
                </div>
                <div style={styles.timelineItem}>
                  <span style={styles.timelineDot} />
                  <div>
                    <p style={{ ...styles.timelineTitle, ...(isMobile ? styles.timelineTitleMobile : null) }}>
                      Завершение обслуживания
                    </p>
                    <p style={{ ...styles.timelineText, ...(isMobile ? styles.timelineTextMobile : null) }}>
                      Финальный статус и история работ сохраняются в аккаунте.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.insightCard}>
              <span style={styles.insightLabel}>Почему это удобно</span>
              <p style={{ ...styles.insightText, ...(isMobile ? styles.insightTextMobile : null) }}>
                Вместо долгого ожидания в сервисе вы сразу видите этапы заявки, ориентир по
                времени и понятный сценарий обслуживания.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section style={styles.sectionBlock}>
        <div style={styles.sectionHeading}>
          <span style={styles.sectionEyebrow}>Преимущества</span>
          <h2 style={{ ...styles.sectionTitle, ...(isMobile ? styles.sectionTitleMobile : null) }}>
            Сервис, который выглядит и работает современно
          </h2>
        </div>
        <div style={{ ...styles.features, ...(isMobile ? styles.singleColumnGrid : null) }}>
          {features.map((feature, index) => (
            <article
              key={feature.title}
              style={{
                ...styles.featureCard,
                ...(isMobile ? styles.featureCardMobile : null),
              }}
            >
              <span style={{ ...styles.featureIndex, ...(isMobile ? styles.featureIndexMobile : null) }}>
                0{index + 1}
              </span>
              <h3 style={{ ...styles.featureTitle, ...(isMobile ? styles.featureTitleMobile : null) }}>
                {feature.title}
              </h3>
              <p
                style={{
                  ...styles.featureDescription,
                  ...(isMobile ? styles.featureDescriptionMobile : null),
                }}
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.sectionBlock}>
        <div style={styles.sectionHeading}>
          <span style={styles.sectionEyebrow}>Как это работает</span>
          <h2 style={{ ...styles.sectionTitle, ...(isMobile ? styles.sectionTitleMobile : null) }}>
            Понятный путь от заявки до готового результата
          </h2>
        </div>
        <div style={{ ...styles.flowGrid, ...(isMobile ? styles.singleColumnGrid : null) }}>
          {serviceFlow.map((item) => (
            <article
              key={item.step}
              style={{
                ...styles.flowCard,
                ...(isMobile ? styles.flowCardMobile : null),
              }}
            >
              <span style={{ ...styles.flowStep, ...(isMobile ? styles.flowStepMobile : null) }}>
                {item.step}
              </span>
              <h3 style={{ ...styles.flowTitle, ...(isMobile ? styles.flowTitleMobile : null) }}>
                {item.title}
              </h3>
              <p
                style={{
                  ...styles.flowDescription,
                  ...(isMobile ? styles.flowDescriptionMobile : null),
                }}
              >
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...styles.linksBlock, ...(isMobile ? styles.linksBlockMobile : null) }}>
        <div style={styles.sectionHeading}>
          <span style={styles.sectionEyebrow}>Навигация</span>
          <h2 style={{ ...styles.linksTitle, ...(isMobile ? styles.sectionTitleMobile : null) }}>
            Быстрый доступ к ключевым разделам
          </h2>
        </div>
        <div style={{ ...styles.linksGrid, ...(isMobile ? styles.singleColumnGrid : null) }}>
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                ...styles.quickLink,
                ...(isMobile ? styles.quickLinkMobile : null),
              }}
            >
              <span style={{ ...styles.quickLinkLabel, ...(isMobile ? styles.quickLinkLabelMobile : null) }}>
                {link.label}
              </span>
              <span
                style={{
                  ...styles.quickLinkDescription,
                  ...(isMobile ? styles.quickLinkDescriptionMobile : null),
                }}
              >
                {link.description}
              </span>
              <span style={{ ...styles.quickLinkArrow, ...(isMobile ? styles.quickLinkArrowMobile : null) }}>
                Перейти
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "48px 24px 64px",
    background:
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.24), transparent 42%), #0f172a",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    display: "grid",
    gap: "30px",
    maxWidth: "1180px",
    margin: "0 auto",
  },
  pageMobile: {
    padding: "20px 14px 40px",
    gap: "22px",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    padding: "36px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.7) 60%, rgba(30, 41, 59, 0.82))",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 30px 80px rgba(2, 6, 23, 0.35)",
  },
  heroMobile: {
    padding: "22px 16px",
    borderRadius: "24px",
  },
  heroGlow: {
    position: "absolute",
    inset: "-80px -120px auto auto",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59, 130, 246, 0.24), transparent 70%)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.9fr)",
    gap: "24px",
    alignItems: "stretch",
  },
  heroContentTablet: {
    gridTemplateColumns: "1fr",
  },
  heroContentMobile: {
    gap: "18px",
  },
  heroMain: {
    display: "grid",
    gap: "18px",
  },
  heroAside: {
    display: "grid",
    gap: "14px",
    alignContent: "start",
  },
  heroAsideMobile: {
    gap: "12px",
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
  },
  badgeNote: {
    color: "#93c5fd",
    fontSize: "13px",
    letterSpacing: "0.02em",
  },
  badgeNoteMobile: {
    fontSize: "12px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(30px, 5vw, 52px)",
    lineHeight: 1.1,
    color: "#f8fafc",
    maxWidth: "11.5ch",
  },
  titleMobile: {
    maxWidth: "100%",
    fontSize: "clamp(28px, 8vw, 40px)",
  },
  subtitle: {
    margin: 0,
    maxWidth: "60ch",
    fontSize: "17px",
    lineHeight: 1.6,
    color: "#cbd5e1",
  },
  subtitleMobile: {
    maxWidth: "100%",
    fontSize: "15px",
  },
  heroHighlights: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  heroHighlightsMobile: {
    gap: "8px",
  },
  heroHighlight: {
    padding: "10px 14px",
    borderRadius: "999px",
    color: "#dbeafe",
    background: "rgba(30, 41, 59, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    fontSize: "14px",
  },
  heroHighlightCompact: {
    width: "100%",
    textAlign: "center",
  },
  primaryActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  primaryActionsMobile: {
    flexDirection: "column",
  },
  button: {
    textDecoration: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 600,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 8px 20px rgba(2, 6, 23, 0.25)",
  },
  buttonMobile: {
    width: "100%",
    textAlign: "center",
    padding: "14px 18px",
  },
  primaryButton: {
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#ffffff",
  },
  secondaryButton: {
    background: "rgba(148, 163, 184, 0.2)",
    color: "#e2e8f0",
    border: "1px solid rgba(148, 163, 184, 0.35)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  metricsGridMobile: {
    gridTemplateColumns: "1fr",
  },
  metricCard: {
    display: "grid",
    gap: "8px",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "rgba(15, 23, 42, 0.68)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  metricCardCompact: {
    padding: "14px 16px",
  },
  metricValue: {
    fontSize: "24px",
    color: "#f8fafc",
    lineHeight: 1,
  },
  metricValueMobile: {
    fontSize: "20px",
  },
  metricLabel: {
    color: "#94a3b8",
    lineHeight: 1.45,
    fontSize: "14px",
  },
  metricLabelMobile: {
    fontSize: "13px",
  },
  previewCard: {
    display: "grid",
    gap: "18px",
    padding: "22px",
    borderRadius: "22px",
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.74) 100%)",
    border: "1px solid rgba(96, 165, 250, 0.22)",
    boxShadow: "0 18px 48px rgba(2, 6, 23, 0.28)",
  },
  previewCardMobile: {
    padding: "18px 16px",
    borderRadius: "20px",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  previewBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "7px 12px",
    borderRadius: "999px",
    color: "#dbeafe",
    background: "rgba(37, 99, 235, 0.22)",
    fontSize: "13px",
    fontWeight: 600,
  },
  previewBadgeMobile: {
    fontSize: "12px",
  },
  previewMeta: {
    color: "#94a3b8",
    fontSize: "13px",
  },
  previewMetaMobile: {
    fontSize: "12px",
  },
  previewRoute: {
    display: "grid",
    gap: "14px",
  },
  previewLabel: {
    margin: "0 0 6px",
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  previewLabelMobile: {
    fontSize: "11px",
  },
  previewValue: {
    color: "#f8fafc",
    fontSize: "16px",
    lineHeight: 1.45,
  },
  previewValueMobile: {
    fontSize: "14px",
    lineHeight: 1.4,
  },
  timeline: {
    display: "grid",
    gap: "14px",
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "14px minmax(0, 1fr)",
    gap: "12px",
    alignItems: "start",
  },
  timelineDot: {
    width: "10px",
    height: "10px",
    marginTop: "6px",
    borderRadius: "50%",
    background: "rgba(148, 163, 184, 0.4)",
    boxShadow: "0 0 0 4px rgba(148, 163, 184, 0.08)",
  },
  timelineDotActive: {
    background: "#60a5fa",
    boxShadow: "0 0 0 4px rgba(96, 165, 250, 0.12)",
  },
  timelineTitle: {
    margin: "0 0 4px",
    color: "#f1f5f9",
    fontSize: "15px",
    fontWeight: 600,
  },
  timelineTitleMobile: {
    fontSize: "14px",
  },
  timelineText: {
    margin: 0,
    color: "#94a3b8",
    lineHeight: 1.5,
    fontSize: "14px",
  },
  timelineTextMobile: {
    fontSize: "13px",
    lineHeight: 1.45,
  },
  insightCard: {
    padding: "18px 20px",
    borderRadius: "20px",
    background: "rgba(30, 41, 59, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  insightLabel: {
    display: "inline-block",
    marginBottom: "8px",
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  insightText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  insightTextMobile: {
    fontSize: "14px",
    lineHeight: 1.55,
  },
  sectionBlock: {
    display: "grid",
    gap: "18px",
  },
  sectionHeading: {
    display: "grid",
    gap: "8px",
  },
  sectionEyebrow: {
    color: "#93c5fd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  sectionTitle: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 34px)",
    color: "#f8fafc",
    lineHeight: 1.15,
    maxWidth: "16ch",
  },
  sectionTitleMobile: {
    maxWidth: "100%",
    fontSize: "clamp(22px, 7vw, 30px)",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  singleColumnGrid: {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  featureCard: {
    borderRadius: "22px",
    padding: "22px",
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.58) 100%)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "grid",
    gap: "12px",
    minHeight: "190px",
  },
  featureCardMobile: {
    minHeight: "unset",
    padding: "18px 16px",
    borderRadius: "18px",
  },
  featureIndex: {
    display: "inline-flex",
    width: "42px",
    height: "42px",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "rgba(37, 99, 235, 0.16)",
    color: "#bfdbfe",
    fontWeight: 700,
  },
  featureIndexMobile: {
    width: "38px",
    height: "38px",
    fontSize: "14px",
  },
  featureTitle: {
    margin: 0,
    color: "#f1f5f9",
    fontSize: "20px",
  },
  featureTitleMobile: {
    fontSize: "18px",
    lineHeight: 1.25,
  },
  featureDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.55,
  },
  featureDescriptionMobile: {
    fontSize: "14px",
    lineHeight: 1.5,
  },
  flowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  flowCard: {
    borderRadius: "22px",
    padding: "22px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "grid",
    gap: "12px",
  },
  flowCardMobile: {
    padding: "18px 16px",
    borderRadius: "18px",
  },
  flowStep: {
    color: "#60a5fa",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  flowStepMobile: {
    fontSize: "12px",
  },
  flowTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "19px",
  },
  flowTitleMobile: {
    fontSize: "17px",
    lineHeight: 1.25,
  },
  flowDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  flowDescriptionMobile: {
    fontSize: "14px",
    lineHeight: 1.5,
  },
  linksBlock: {
    borderRadius: "24px",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.58)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    display: "grid",
    gap: "18px",
  },
  linksBlockMobile: {
    padding: "20px 16px",
    borderRadius: "22px",
  },
  linksTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "clamp(24px, 3vw, 32px)",
    lineHeight: 1.15,
    maxWidth: "17ch",
  },
  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  quickLink: {
    textDecoration: "none",
    padding: "18px",
    borderRadius: "18px",
    color: "#dbeafe",
    background:
      "linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.72) 100%)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    fontWeight: 500,
    display: "grid",
    gap: "10px",
    minHeight: "150px",
  },
  quickLinkMobile: {
    minHeight: "unset",
    padding: "16px",
    borderRadius: "16px",
  },
  quickLinkLabel: {
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: 600,
  },
  quickLinkLabelMobile: {
    fontSize: "16px",
    lineHeight: 1.3,
  },
  quickLinkDescription: {
    color: "#94a3b8",
    lineHeight: 1.55,
  },
  quickLinkDescriptionMobile: {
    fontSize: "14px",
    lineHeight: 1.5,
  },
  quickLinkArrow: {
    marginTop: "auto",
    color: "#93c5fd",
    fontSize: "14px",
  },
  quickLinkArrowMobile: {
    fontSize: "13px",
  },
};
