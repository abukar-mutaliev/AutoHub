import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../features/auth";
import { routes } from "../../../shared/config/routes";
import { saveAccessToken } from "../../../shared/api/axiosClient";
import { routeByRole, saveAuthUser } from "../../../shared/lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const result = await login(form);
      saveAccessToken(result.data.accessToken);
      saveAuthUser(result.data.user);
      navigate(routeByRole(result.data.user.role));
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? "Вход не выполнён. Попробуйте снова.");
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Вход в AutoHub</h1>
        <p style={styles.subtitle}>Авторизуйтесь, чтобы управлять заявками и статусом работ.</p>
      <form onSubmit={onSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Телефон"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
        <input
          style={styles.input}
          placeholder="Пароль"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        <button type="submit" style={styles.button}>
          Войти
        </button>
      </form>
      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.footerText}>
        Нет аккаунта?{" "}
        <Link to={routes.register} style={styles.link}>
          Регистрация
        </Link>
      </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.22), transparent 45%), #0f172a",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "20px",
    padding: "28px",
    backdropFilter: "blur(8px)",
  },
  title: {
    margin: "0 0 10px",
    color: "#f8fafc",
    fontSize: "30px",
  },
  subtitle: {
    margin: "0 0 18px",
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
  form: {
    display: "grid",
    gap: "12px",
  },
  input: {
    height: "44px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    padding: "0 12px",
    outline: "none",
  },
  button: {
    marginTop: "6px",
    height: "44px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    marginTop: "12px",
    color: "#fca5a5",
  },
  footerText: {
    margin: "16px 0 0",
    color: "#cbd5e1",
  },
  link: {
    color: "#93c5fd",
    textDecoration: "none",
  },
};
