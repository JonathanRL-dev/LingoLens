import { healthRouter } from './health.routes';
import { Router } from 'express';
import { profileRouter } from './profile.routes';
import { missionRouter } from './mission.routes';
export const apiRouter = Router();
apiRouter.use(healthRouter);
apiRouter.use(profileRouter);
apiRouter.use(missionRouter);
