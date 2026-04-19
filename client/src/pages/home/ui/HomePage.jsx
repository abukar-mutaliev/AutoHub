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

  const quickLinks = [];
  if (!isAuthenticated) {
    quickLinks.push({ to: routes.login, label: "Войти" });
    quickLinks.push({ to: routes.register, label: "Регистрация" });
  }
  quickLinks.push(
    { to: routes.services, label: "Каталог услуг" },
    { to: routes.orders, label: "Мои заказы" }
  );
  if (user?.role === "OWNER") {
    quickLinks.push({ to: routes.ownerPanel, label: "Панель владельца" });
  }
  if (user?.role === "MASTER") {
    quickLinks.push({ to: routes.masterPanel, label: "Панель мастера" });
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

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <span style={styles.badge}>AutoHub</span>
        <h1 style={styles.title}>Современный выездной автосервис без ожидания в очередях</h1>
        <p style={styles.subtitle}>
          Создавайте заявку за минуту, выбирайте удобное время и контролируйте обслуживание
          автомобиля онлайн.
        </p>
        <div style={styles.primaryActions}>
          <Link
            to={isAuthenticated ? routes.services : routes.register}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Оставить заявку
          </Link>
          <Link to={routes.services} style={{ ...styles.button, ...styles.secondaryButton }}>
            Посмотреть услуги
          </Link>
        </div>
      </section>

      <section style={styles.features}>
        {features.map((feature) => (
          <article key={feature.title} style={styles.featureCard}>
            <h2 style={styles.featureTitle}>{feature.title}</h2>
            <p style={styles.featureDescription}>{feature.description}</p>
          </article>
        ))}
      </section>

      <section style={styles.linksBlock}>
        <h3 style={styles.linksTitle}>Быстрый доступ</h3>
        <div style={styles.linksGrid}>
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} style={styles.quickLink}>
              {link.label}
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
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 45%), #0f172a",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    display: "grid",
    gap: "28px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  hero: {
    padding: "32px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    backdropFilter: "blur(8px)",
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
  title: {
    margin: "18px 0 14px",
    fontSize: "clamp(30px, 5vw, 52px)",
    lineHeight: 1.1,
    color: "#f8fafc",
    maxWidth: "14ch",
  },
  subtitle: {
    margin: 0,
    maxWidth: "65ch",
    fontSize: "17px",
    lineHeight: 1.6,
    color: "#cbd5e1",
  },
  primaryActions: {
    marginTop: "28px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  button: {
    textDecoration: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontWeight: 600,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 8px 20px rgba(2, 6, 23, 0.25)",
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
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  featureCard: {
    borderRadius: "16px",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.65)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  featureTitle: {
    margin: "0 0 10px",
    color: "#f1f5f9",
    fontSize: "20px",
  },
  featureDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.55,
  },
  linksBlock: {
    borderRadius: "16px",
    padding: "20px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  linksTitle: {
    margin: "0 0 14px",
    color: "#f8fafc",
    fontSize: "18px",
  },
  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "10px",
  },
  quickLink: {
    textDecoration: "none",
    padding: "12px 14px",
    borderRadius: "10px",
    color: "#dbeafe",
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    fontWeight: 500,
  },
};
