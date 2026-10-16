import { healthRouter } from './health.routes';
import { Router } from 'express';
export const apiRouter = Router();
apiRouter.use(healthRouter);
import { profileRouter } from './profile.routes';
apiRouter.use(profileRouter);
