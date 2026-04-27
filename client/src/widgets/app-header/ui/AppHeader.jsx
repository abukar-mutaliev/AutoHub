import { useEffect, useState } from "react";
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
    overflow: "visible",
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
    textDecoration: "none",
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
  menuButton: {
    height: "34px",
    minWidth: "40px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background: "rgba(15, 23, 42, 0.65)",
    color: "#e2e8f0",
    fontSize: "18px",
    lineHeight: 1,
    cursor: "pointer",
  },
  mobileMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: "12px",
    right: "12px",
    width: "auto",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.85)",
  },
  mobileMenuLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  mobileNavLink: {
    textDecoration: "none",
    color: "#cbd5e1",
    fontWeight: 500,
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(15, 23, 42, 0.55)",
  },
  mobileMenuControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
};

export function AppHeader({ user, isAuthenticated, onLogout }) {
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 1280;
    }

    return window.innerWidth;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (viewportWidth > 720) {
      setIsMenuOpen(false);
    }
  }, [viewportWidth]);

  const isTablet = viewportWidth <= 1024;
  const isMobile = viewportWidth <= 720;

  const adaptiveHeaderStyle = {
    ...styles.header,
    padding: isMobile ? "8px 12px" : isTablet ? "10px 16px" : styles.header.padding,
    gap: isMobile ? "8px" : styles.header.gap,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "nowrap",
  };

  const adaptiveHeaderStartStyle = {
    ...styles.headerStart,
    width: "auto",
    justifyContent: "flex-start",
  };

  const adaptiveBrandStyle = {
    ...styles.brand,
    fontSize: isMobile ? "19px" : isTablet ? "20px" : styles.brand.fontSize,
  };

  const adaptiveNavStyle = {
    ...styles.nav,
    width: "auto",
    justifyContent: styles.nav.justifyContent,
    flexWrap: styles.nav.flexWrap,
    overflowX: "visible",
    paddingBottom: 0,
    scrollbarWidth: "auto",
  };

  const adaptiveNavLinkStyle = {
    ...styles.navLink,
    padding: isMobile ? "8px 10px" : styles.navLink.padding,
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const adaptiveHeaderEndStyle = {
    ...styles.headerEnd,
    marginLeft: styles.headerEnd.marginLeft,
    width: "auto",
    justifyContent: styles.headerEnd.justifyContent,
    gap: isMobile ? "8px" : styles.headerEnd.gap,
  };

  const adaptiveUserProfileLinkStyle = {
    ...styles.userProfileLink,
    maxWidth: isMobile ? "55vw" : styles.userProfileLink.maxWidth,
  };

  const adaptiveLogoutButtonStyle = {
    ...styles.logoutButton,
    height: isMobile ? "34px" : styles.logoutButton.height,
    padding: isMobile ? "0 12px" : styles.logoutButton.padding,
  };

  const adaptiveLoginLinkStyle = {
    ...styles.loginLink,
    padding: isMobile ? "7px 10px" : styles.loginLink.padding,
  };

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <header className="app-header" style={adaptiveHeaderStyle}>
      <div style={adaptiveHeaderStartStyle}>
        <Link to={routes.home} style={adaptiveBrandStyle} onClick={closeMobileMenu}>
          AutoHub
        </Link>
      </div>
      {isMobile ? (
        <button
          type="button"
          aria-label="Открыть меню"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          style={styles.menuButton}
        >
          {isMenuOpen ? "×" : "☰"}
        </button>
      ) : (
        <>
          <nav className="app-header-nav" style={adaptiveNavStyle}>
            <Link to={routes.home} style={adaptiveNavLinkStyle}>
              Главная
            </Link>
            <Link to={routes.services} style={adaptiveNavLinkStyle}>
              Услуги
            </Link>
            <Link to={routes.orders} style={adaptiveNavLinkStyle}>
              Заказы
            </Link>
            {isAuthenticated && user?.role === "OWNER" ? (
              <Link to={routes.ownerPanel} style={adaptiveNavLinkStyle}>
                Панель владельца
              </Link>
            ) : null}
            {isAuthenticated && user?.role === "MASTER" ? (
              <Link to={routes.masterPanel} style={adaptiveNavLinkStyle}>
                Панель мастера
              </Link>
            ) : null}
          </nav>
          <div className="app-header-controls" style={adaptiveHeaderEndStyle}>
            {isAuthenticated && user ? (
              <Link to={routes.profile} className="app-header-user-link" style={adaptiveUserProfileLinkStyle}>
                {user.name}
              </Link>
            ) : null}
            {isAuthenticated ? (
              <button type="button" onClick={onLogout} style={adaptiveLogoutButtonStyle}>
                Выйти
              </button>
            ) : (
              <Link to={routes.login} style={adaptiveLoginLinkStyle}>
                Войти
              </Link>
            )}
          </div>
        </>
      )}

      {isMobile && isMenuOpen ? (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileMenuLinks}>
            <Link to={routes.home} style={styles.mobileNavLink} onClick={closeMobileMenu}>
              Главная
            </Link>
            <Link to={routes.services} style={styles.mobileNavLink} onClick={closeMobileMenu}>
              Услуги
            </Link>
            <Link to={routes.orders} style={styles.mobileNavLink} onClick={closeMobileMenu}>
              Заказы
            </Link>
            {isAuthenticated && user?.role === "OWNER" ? (
              <Link to={routes.ownerPanel} style={styles.mobileNavLink} onClick={closeMobileMenu}>
                Панель владельца
              </Link>
            ) : null}
            {isAuthenticated && user?.role === "MASTER" ? (
              <Link to={routes.masterPanel} style={styles.mobileNavLink} onClick={closeMobileMenu}>
                Панель мастера
              </Link>
            ) : null}
            {isAuthenticated && user ? (
              <Link to={routes.profile} className="app-header-user-link" style={styles.mobileNavLink} onClick={closeMobileMenu}>
                {user.name}
              </Link>
            ) : null}
          </div>
          <div style={styles.mobileMenuControls}>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  onLogout();
                }}
                style={adaptiveLogoutButtonStyle}
              >
                Выйти
              </button>
            ) : (
              <Link to={routes.login} style={adaptiveLoginLinkStyle} onClick={closeMobileMenu}>
                Войти
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
