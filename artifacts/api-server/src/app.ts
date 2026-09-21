import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { DatabaseUnavailableError } from "./db/mongo";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof DatabaseUnavailableError) {
    return res.status(503).json({ message: "Database unavailable" });
  }
  logger.error({ err: error }, "Unhandled API error");
  return res.status(500).json({ message: "Internal server error" });
});

export default app;
