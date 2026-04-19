import { Link } from "react-router-dom";
import { routes } from "../../../shared/config/routes";

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(10px)",
    background: "rgba(15, 23, 42, 0.7)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 24px",
    flexWrap: "wrap",
  },
  headerStart: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },
  brand: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "0.02em",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
    flex: "1 1 200px",
    minWidth: 0,
  },
  navLink: {
    textDecoration: "none",
    color: "#cbd5e1",
    fontWeight: 500,
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.55)",
  },
  headerEnd: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginLeft: "auto",
  },
  userProfileLink: {
    textDecoration: "none",
    color: "#bfdbfe",
    fontSize: "14px",
    fontWeight: 500,
    padding: "6px 10px",
    borderRadius: "10px",
    border: "1px solid transparent",
    maxWidth: "min(260px, 42vw)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    height: "36px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(120deg, #2563eb, #3b82f6)",
    color: "#fff",
    fontWeight: 600,
    padding: "0 14px",
    cursor: "pointer",
  },
  loginLink: {
    textDecoration: "none",
    color: "#dbeafe",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.55)",
    fontWeight: 600,
  },
};

export function AppHeader({ user, isAuthenticated, onLogout }) {
  return (
    <header className="app-header" style={styles.header}>
      <div style={styles.headerStart}>
        <div style={styles.brand}>AutoHub</div>
      </div>
      <nav className="app-header-nav" style={styles.nav}>
        <Link to={routes.home} style={styles.navLink}>
          Главная
        </Link>
        <Link to={routes.services} style={styles.navLink}>
          Услуги
        </Link>
        <Link to={routes.orders} style={styles.navLink}>
          Заказы
        </Link>
      </nav>
      <div className="app-header-controls" style={styles.headerEnd}>
        {isAuthenticated && user ? (
          <Link to={routes.profile} className="app-header-user-link" style={styles.userProfileLink}>
            {user.name}
          </Link>
        ) : null}
        {isAuthenticated ? (
          <button type="button" onClick={onLogout} style={styles.logoutButton}>
            Выйти
          </button>
        ) : (
          <Link to={routes.login} style={styles.loginLink}>
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}
