import { Router } from 'express';
import * as controller from '../controllers/mission.controller';
import * as sessionController from '../controllers/session.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { missionParamsSchema, sessionParamsSchema } from '../validators/missions';
import { scanAttemptRequestSchema } from '../validators/scans';

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
missionRouter.post(
  '/sessions/:sid/scan-attempts',
  requireAuth,
  validate({ params: sessionParamsSchema, body: scanAttemptRequestSchema }),
  sessionController.scanAttempt,
);
missionRouter.get(
  '/sessions/:sid/exercises',
  requireAuth,
  validate({ params: sessionParamsSchema }),
  sessionController.exercises,
);
