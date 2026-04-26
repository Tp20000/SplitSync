// FILE: apps/server/src/shared/utils/logger.ts
// PURPOSE: Centralized Winston logger with console + rotating file transports
// DEPENDS ON: winston, winston-daily-rotate-file
// LAST UPDATED: F04 - Express Server Base

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { isDev } from "../../config/env";

// ─────────────────────────────────────────────
// Log format
// ─────────────────────────────────────────────

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0
        ? "\n" + JSON.stringify(meta, null, 2)
        : "";
    return `[${timestamp as string}] ${level}: ${message as string}${metaStr}`;
  })
);

// ─────────────────────────────────────────────
// Transports
// ─────────────────────────────────────────────

const transports: winston.transport[] = [
  // Console — always on
  new winston.transports.Console({
    format: consoleFormat,
    level: isDev ? "debug" : "info",
  }),
];

// File transports — only in non-test environments
if (process.env.NODE_ENV !== "test") {
  // Error log — errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join("logs", "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d",
      maxSize: "20m",
      format: logFormat,
    })
  );

  // Combined log — all levels
  transports.push(
    new DailyRotateFile({
      filename: path.join("logs", "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "7d",
      maxSize: "20m",
      format: logFormat,
    })
  );
}

// ─────────────────────────────────────────────
// Logger instance
// ─────────────────────────────────────────────

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  transports,
  exitOnError: false,
});

// ─────────────────────────────────────────────
// Stream for Morgan HTTP logger
// ─────────────────────────────────────────────

export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};