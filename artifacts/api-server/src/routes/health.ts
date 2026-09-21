import { Router, type IRouter } from "express";
import { getDatabaseHealth } from "../db/mongo";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const database = getDatabaseHealth();
  const healthy = database.status !== "error" && database.status !== "connecting";
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database: database.status,
    configured: database.configured,
  });
});

export default router;
