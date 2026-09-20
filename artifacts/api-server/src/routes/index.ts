import { Router, type IRouter } from "express";
import healthRouter from "./health";
import safetestRouter from "./safetest";

const router: IRouter = Router();

router.use(healthRouter);
router.use(safetestRouter);

export default router;
