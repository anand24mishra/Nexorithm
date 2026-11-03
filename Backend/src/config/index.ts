import { AppConfig } from "../types";

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.includes("dev-secret") ||
      process.env.USE_DB !== "true" ||
      !process.env.MONGODB_URI)
  )
    throw new Error(
      "Production requires durable database and strong JWT_SECRET",
    );
  return {
    port: Number(getEnv("PORT", "8000")),
    mongodbUri: getEnv("MONGODB_URI", ""),
    jwtSecret: getEnv(
      "JWT_SECRET",
      "nexorithm-dev-secret-change-in-production",
    ),
    googleClientId: getEnv("GOOGLE_CLIENT_ID", ""),
    useDb: getEnv("USE_DB", "false") === "true",
    nodeEnv: getEnv("NODE_ENV", "development"),
  };
}
