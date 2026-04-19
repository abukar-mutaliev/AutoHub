import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

function normalizeError(err) {
  if (err instanceof HttpError) {
    return err;
  }
  if (err && typeof err === "object" && "status" in err && Number.isInteger(err.status)) {
    return new HttpError(
      err.status,
      err.code ?? "ERROR",
      typeof err.message === "string" ? err.message : "Error",
      err.details
    );
  }
  if (err instanceof Error) {
    return new HttpError(500, "INTERNAL_ERROR", err.message);
  }
  return new HttpError(500, "INTERNAL_ERROR", "Unexpected server error");
}

function publicMessage(handled) {
  if (handled.status < 500) {
    return handled.message;
  }
  if (env.nodeEnv === "production") {
    return "Серверная ошибка. Повторите запрос или обратитесь в поддержку.";
  }
  return handled.message;
}

function logError(req, handled, original) {
  const line = {
    level: "error",
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl ?? req.url,
    status: handled.status,
    code: handled.code,
    message: handled.message
  };
  if (original instanceof Error && handled.status >= 500) {
    line.stack = original.stack;
  } else if (env.nodeEnv !== "production" && handled.status >= 500) {
    line.stack = handled.stack;
  }
  if (handled.details !== undefined) {
    line.details = handled.details;
  }
  if (handled.status >= 500) {
    console.error("[api]", JSON.stringify(line));
  } else {
    console.warn("[api]", JSON.stringify(line));
  }
}

export function errorMiddleware(err, req, res, _next) {
  const handled = normalizeError(err);
  const status = handled.status;
  const requestId = req.requestId;
  const message = publicMessage(handled);

  logError(req, handled, err);

  return res.status(status).json({
    error: {
      code: handled.code,
      message,
      requestId: requestId ?? null,
      details: handled.status < 500 && handled.details !== undefined ? handled.details : undefined
    }
  });
}
