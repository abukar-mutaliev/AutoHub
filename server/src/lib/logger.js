import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, json, colorize, printf } = winston.format;

const consoleFormat =
  env.nodeEnv === "production"
    ? combine(timestamp(), json())
    : combine(
        colorize({ all: true }),
        printf((info) => {
          const { level, message, ...rest } = info;
          const restStr = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
          return `${level}: ${message}${restStr}`;
        })
      );

export const logger = winston.createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  format: consoleFormat,
  transports: [new winston.transports.Console()]
});

export function auditFinance(event, meta) {
  logger.info("audit_finance", { type: "audit_finance", event, ...meta });
}
