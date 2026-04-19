import { HttpError } from "../utils/httpError.js";

/**
 * @param {("CLIENT" | "MASTER" | "OWNER")[]} roles
 * @param {{ message?: string }} [options] — краткое пояснение; иначе собираем из ролей
 */
export function roleMiddleware(roles, options) {
  const roleLabel = (r) => {
    if (r === "CLIENT") {
      return "клиент";
    }
    if (r === "MASTER") {
      return "мастер";
    }
    if (r === "OWNER") {
      return "владелец / администратор";
    }
    return r;
  };

  return (req, _res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    const required = roles.map(roleLabel).join(" или ");
    const custom = options?.message;
    const message =
      custom ??
      (req.user
        ? `Недостаточно прав: нужна роль ${required} (текущая: ${req.user.role}).`
        : `Недостаточно прав: нужна роль ${required}.`);
    return next(
      new HttpError(403, "FORBIDDEN", message, {
        requiredRoles: roles,
        currentRole: req.user?.role
      })
    );
  };
}
