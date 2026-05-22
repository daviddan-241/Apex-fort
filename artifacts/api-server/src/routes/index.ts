import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import filesRouter from "./files";
import agentsRouter from "./agents";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(filesRouter);
router.use(agentsRouter);
router.use(mediaRouter);

export default router;
