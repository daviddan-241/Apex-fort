import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import configRouter from "./config";
import chatRouter from "./chat";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(configRouter);
router.use(chatRouter);
router.use(leaderboardRouter);

export default router;
