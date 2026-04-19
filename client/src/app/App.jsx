import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getMe, logout, refreshAccessToken } from "../features/auth";
import { clearAccessToken, getAccessToken } from "../shared/api/axiosClient";
import { routes } from "../shared/config/routes";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../shared/lib/auth";
import { subscribeToToasts } from "../shared/lib/toast";
import { AppHeader } from "../widgets/app-header";
import { SessionProvider } from "./providers/session-context";

export function App() {
  const navigate = useNavigate();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [sessionTick, setSessionTick] = useState(0);
  const [toasts, setToasts] = useState([]);
  const user = getAuthUser();
  const isAuthenticated = Boolean(getAccessToken());

  useEffect(() => {
    async function hydrateSession() {
      if (!getAccessToken()) return;

      try {
        const me = await getMe();
        saveAuthUser(me.data);
        setSessionTick((value) => value + 1);
      } catch {
        try {
          const refreshResult = await refreshAccessToken();
          if (refreshResult?.data?.accessToken) {
            const me = await getMe();
            saveAuthUser(me.data);
            setSessionTick((value) => value + 1);
            return;
          }
        } catch {
          // Ignore and clear below.
        }

        clearAccessToken();
        clearAuthUser();
        setSessionTick((value) => value + 1);
      } finally {
        setIsSessionLoading(false);
      }
    }

    hydrateSession();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, ...toast }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3000);
    });

    return unsubscribe;
  }, []);

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore network errors and clear local session anyway.
    } finally {
      clearAccessToken();
      clearAuthUser();
      setSessionTick((value) => value + 1);
      navigate(routes.login);
    }
  };

  return (
    <SessionProvider
      value={{
        isSessionLoading,
        sessionTick,
        refreshSession: () => setSessionTick((value) => value + 1)
      }}
    >
      <div className="app-shell" style={styles.appShell}>
        <AppHeader user={user} isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="app-main" style={styles.main}>
          <Outlet />
        </main>
        <div className="toast-stack">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-item toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </SessionProvider>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 45%), #020617",
    color: "#e2e8f0",
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  main: {
    paddingTop: "6px",
  },
};
