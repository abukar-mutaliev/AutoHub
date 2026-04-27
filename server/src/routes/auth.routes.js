import { Router } from "express";
import rateLimit from "express-rate-limit";
import { HttpError } from "../utils/httpError.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateMiddleware } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { getUserById, loginByPhone, registerClient } from "../services/auth.service.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/"
  });
}

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Слишком много попыток входа. Подождите минуту."
      }
    });
  }
});

authRouter.post("/register", validateMiddleware(registerSchema), async (req, res, next) => {
  try {
    const user = await registerClient(req.validatedBody);
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ data: { user, accessToken } });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", loginLimiter, validateMiddleware(loginSchema), async (req, res, next) => {
  try {
    const user = await loginByPhone(req.validatedBody.phone, req.validatedBody.password);
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.json({ data: { user, accessToken } });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      return next(
        new HttpError(401, "UNAUTHORIZED", "Нет cookie сессии. Войдите в систему снова.", { reason: "NO_REFRESH_TOKEN" })
      );
    }

    const payload = verifyRefreshToken(token);
    const user = await getUserById(payload.sub);
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.json({ data: { accessToken } });
  } catch {
    return next(
      new HttpError(401, "UNAUTHORIZED", "Сессия истекла или недействительна. Войдите снова.", { reason: "INVALID_REFRESH_TOKEN" })
    );
  }
});

authRouter.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  return res.json({ data: { ok: true } });
});
