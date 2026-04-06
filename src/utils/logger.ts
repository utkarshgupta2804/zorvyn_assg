type Level = "info" | "warn" | "error" | "debug";

function log(level: Level, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const suffix = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
  const logFn = level === "debug" ? console.log : console[level];
  logFn.call(console, `[${ts}] [${level.toUpperCase()}] ${message}${suffix}`);
}

export const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
};
