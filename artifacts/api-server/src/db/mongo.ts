import mongoose from "mongoose";
import { logger } from "../lib/logger";
import { seedMongoDatabase } from "./seed";

export type DatabaseHealth = {
  configured: boolean;
  status: "memory" | "connecting" | "ready" | "error";
  error?: string;
};

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("MongoDB is unavailable");
    this.name = "DatabaseUnavailableError";
  }
}

let health: DatabaseHealth = {
  configured: Boolean(process.env.MONGODB_URI),
  status: process.env.MONGODB_URI ? "connecting" : "memory",
};

export function getDatabaseHealth(): DatabaseHealth {
  return { ...health };
}

export function assertDatabaseAvailable() {
  if (health.status === "error") {
    throw new DatabaseUnavailableError();
  }
}

export async function initializeDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    health = { configured: false, status: "memory" };
    return;
  }

  health = { configured: true, status: "connecting" };
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
      appName: "drug-lense-api",
    });
    await mongoose.connection.syncIndexes();
    if (process.env.MONGODB_SEED === "true") await seedMongoDatabase();
    health = { configured: true, status: "ready" };
    logger.info("MongoDB connection ready");
  } catch (error) {
    health = { configured: true, status: "error", error: error instanceof Error ? error.message : "Unknown MongoDB connection error" };
    logger.error({ err: error }, "MongoDB connection failed");
    await mongoose.disconnect().catch(() => undefined);
  }

  mongoose.connection.on("disconnected", () => {
    if (health.configured) health = { configured: true, status: "error", error: "MongoDB connection closed" };
  });
}

export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}