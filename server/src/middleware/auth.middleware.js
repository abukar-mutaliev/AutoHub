import { HttpError } from "../utils/httpError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(
      new HttpError(401, "UNAUTHORIZED", "Токен не передан. Войдите в систему снова.", { reason: "NO_ACCESS_TOKEN" })
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, "UNAUTHORIZED", "Сессия недействительна или устарела. Войдите снова.", { reason: "INVALID_ACCESS_TOKEN" }));
  }
}
