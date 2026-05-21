import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import weaponsRouter from "./weapons";
import gameModesRouter from "./gamemodes";
import systemsRouter from "./systems";
import progressionRouter from "./progression";

const router: IRouter = Router();

router.use(healthRouter);
router.use(charactersRouter);
router.use(weaponsRouter);
router.use(gameModesRouter);
router.use(systemsRouter);
router.use(progressionRouter);

export default router;
