import { randomUUID } from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { assignmentsRouter } from "./routes/assignments.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { paymentsRouter } from "./routes/payments.routes.js";
import { pushRouter } from "./routes/push.routes.js";
import { servicesRouter } from "./routes/services.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set([
    env.frontendUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173"
  ]);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin is not allowed"));
      },
      credentials: true
    })
  );
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    // Do not throttle CORS preflight requests.
    skip: (req) => req.method === "OPTIONS"
  });
  app.use("/api/v1", apiLimiter);
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    return next();
  });
  app.use(
    morgan(
      (tokens, req, res) =>
        [
          req.requestId ? req.requestId.slice(0, 8) : "-",
          tokens.method(req, res),
          tokens.url(req, res),
          tokens.status(req, res),
          tokens["response-time"](req, res),
          "ms"
        ].join(" ")
    )
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/v1/health", (_req, res) => {
    res.json({
      data: { status: "ok" },
      meta: { timestamp: new Date().toISOString() }
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/services", servicesRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1/assignments", assignmentsRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/push", pushRouter);
  app.use(errorMiddleware);

  return app;
}
