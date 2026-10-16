import { Router } from 'express';
import * as controller from '../controllers/mission.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { missionParamsSchema, sessionParamsSchema } from '../validators/missions';

export const missionRouter = Router();
missionRouter.get('/missions', requireAuth, controller.list);
missionRouter.get(
  '/missions/:id',
  requireAuth,
  validate({ params: missionParamsSchema }),
  controller.detail,
);
missionRouter.post(
  '/missions/:id/sessions',
  requireAuth,
  validate({ params: missionParamsSchema }),
  controller.startSession,
);
missionRouter.post(
  '/sessions/:sid/hints',
  requireAuth,
  validate({ params: sessionParamsSchema }),
  controller.hint,
);
