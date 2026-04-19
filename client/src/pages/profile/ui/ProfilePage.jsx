import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../../../app/providers/session-context";
import { getProfile, updateProfile } from "../../../features/users";
import { routes } from "../../../shared/config/routes";
import { saveAuthUser } from "../../../shared/lib/auth";

const roleLabels = {
  CLIENT: "Клиент",
  MASTER: "Мастер",
  OWNER: "Владелец"
};

export function ProfilePage() {
  const { refreshSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    newPassword: ""
  });
  const [meta, setMeta] = useState({ role: "", createdAt: null, isActive: true });

  useEffect(() => {
    let cancelled = false;
    setError("");
    getProfile()
      .then((result) => {
        if (cancelled) return;
        const user = result.data;
        setForm({
          name: user.name ?? "",
          phone: user.phone ?? "",
          email: user.email ?? "",
          newPassword: ""
        });
        setMeta({
          role: user.role ?? "",
          createdAt: user.createdAt,
          isActive: user.isActive
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error?.message ?? "Не удалось загрузить профиль.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        newPassword: form.newPassword
      };
      const result = await updateProfile(payload);
      const user = result.data;
      saveAuthUser({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role
      });
      refreshSession();
      setForm((prev) => ({ ...prev, newPassword: "" }));
      setMeta((prev) => ({
        ...prev,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      setMessage("Изменения сохранены.");
    } catch (err) {
      setError(err.response?.data?.error?.message ?? "Не удалось сохранить данные.");
    } finally {
      setSaving(false);
    }
  };

  const createdLabel = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : null;

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>Профиль</h1>
        <p style={styles.subtitle}>Управляйте именем, контактами и паролем — как в вашей учётной записи в схеме данных.</p>

        {loading ? (
          <p style={styles.muted}>Загрузка…</p>
        ) : (
          <>
            <div style={styles.metaRow}>
              {meta.role ? (
                <span style={styles.chip}>{roleLabels[meta.role] ?? meta.role}</span>
              ) : null}
              {createdLabel ? <span style={styles.chipMuted}>Регистрация: {createdLabel}</span> : null}
              <span style={styles.chipMuted}>{meta.isActive ? "Активен" : "Неактивен"}</span>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
            {message ? <p style={styles.success}>{message}</p> : null}

            <form onSubmit={onSubmit} style={styles.form}>
              <label style={styles.label}>
                Имя
                <input
                  style={styles.input}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label style={styles.label}>
                Телефон
                <input
                  style={styles.input}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </label>
              <label style={styles.label}>
                Email
                <input
                  style={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder="Необязательно"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <label style={styles.label}>
                Новый пароль
                <input
                  style={styles.input}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                />
              </label>
              <button type="submit" style={styles.button} disabled={saving}>
                {saving ? "Сохранение…" : "Сохранить изменения"}
              </button>
            </form>

            <p style={styles.footerText}>
              <Link to={routes.home} style={styles.link}>
                На главную
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    padding: "36px 20px 56px",
    background:
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 45%), transparent",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  panel: {
    maxWidth: "520px",
    margin: "0 auto",
    borderRadius: "20px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.68)",
    padding: "28px",
    backdropFilter: "blur(8px)",
  },
  title: { margin: "0 0 8px", fontSize: "32px", color: "#f8fafc" },
  subtitle: { margin: "0 0 18px", color: "#cbd5e1", lineHeight: 1.5 },
  metaRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" },
  chip: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    background: "rgba(59, 130, 246, 0.2)",
    color: "#bfdbfe",
  },
  chipMuted: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    color: "#94a3b8",
    border: "1px solid rgba(148, 163, 184, 0.25)",
  },
  muted: { color: "#94a3b8", margin: 0 },
  form: { display: "grid", gap: "14px" },
  label: { display: "grid", gap: "6px", color: "#cbd5e1", fontSize: "14px" },
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
  error: { color: "#fca5a5", margin: "0 0 12px" },
  success: { color: "#86efac", margin: "0 0 12px" },
  footerText: { margin: "20px 0 0", color: "#cbd5e1" },
  link: { color: "#93c5fd", textDecoration: "none" },
};
