import mongoose from "mongoose";
import { logger } from "../telemetry";
export async function connectDatabase(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  logger.info({ operation: "database_connect", outcome: "connected" });
}
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
