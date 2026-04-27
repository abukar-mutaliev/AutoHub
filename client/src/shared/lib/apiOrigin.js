export function getApiOrigin() {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
  try {
    return new URL(base).origin;
  } catch {
    return "http://localhost:3001";
  }
}
