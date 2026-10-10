import { isProduction } from "../env";

type Level = "debug" | "info" | "warn" | "error";

const emit = (level: Level, message: string, meta?: unknown) => {
  if (level === "debug" && isProduction) return;

  const line = isProduction
    ? JSON.stringify({
        level,
        message,
        time: new Date().toISOString(),
        ...(meta && typeof meta === "object" ? meta : { meta }),
      })
    : `${level.toUpperCase()} ${message}`;

  if (level === "error") console.error(line, !isProduction && meta ? meta : "");
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

export const logger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
