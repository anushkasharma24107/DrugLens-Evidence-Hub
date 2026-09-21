import { closeDatabase, getDatabaseHealth, initializeDatabase } from "./mongo";
import { seedMongoDatabase } from "./seed";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required to seed MongoDB");
await initializeDatabase();
if (getDatabaseHealth().status !== "ready") throw new Error("MongoDB did not become ready");
await seedMongoDatabase();
await closeDatabase();