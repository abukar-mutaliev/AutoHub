import { routes } from "../config/routes";

const USER_KEY = "authUser";

export function routeByRole(role) {
  if (role === "OWNER") return routes.ownerPanel;
  if (role === "MASTER") return routes.masterPanel;
  return routes.home;
}

export function saveAuthUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(USER_KEY);
}
