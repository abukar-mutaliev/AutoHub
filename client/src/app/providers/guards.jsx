import { Navigate } from "react-router-dom";
import { getAccessToken } from "../../shared/api/axiosClient";
import { routes } from "../../shared/config/routes";
import { getAuthUser } from "../../shared/lib/auth";
import { useSession } from "./session-context";

export function RequireAuth({ children }) {
  const { isSessionLoading } = useSession();
  if (isSessionLoading && getAccessToken()) {
    return <div>Восстановление сессии...</div>;
  }

  if (!getAccessToken()) {
    return <Navigate to={routes.login} replace />;
  }

  return children;
}

export function RequireRole({ roles, children }) {
  const { isSessionLoading } = useSession();
  const token = getAccessToken();
  const user = getAuthUser();

  if (isSessionLoading && token) {
    return <div>Восстановление сессии...</div>;
  }

  if (!token) {
    return <Navigate to={routes.login} replace />;
  }

  if (!user) {
    return children;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={routes.home} replace />;
  }

  return children;
}

export function RedirectIfAuthenticated({ children }) {
  const { isSessionLoading } = useSession();
  if (isSessionLoading && getAccessToken()) {
    return <div>Восстановление сессии...</div>;
  }

  if (getAccessToken()) {
    return <Navigate to={routes.home} replace />;
  }

  return children;
}
