import { Router } from 'express';
import * as controller from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { allowDemoReset } from '../middleware/demoReset';
import { validate } from '../middleware/validate';
import { createLimiter } from '../middleware/rateLimit';
import {
  createGuestRequestSchema,
  updateMeRequestSchema,
  vocabularyParamsSchema,
} from '../validators/profile';

export const profileRouter = Router();
profileRouter.post(
  '/auth/guest',
  createLimiter({ windowMs: 60_000, max: 100 }),
  validate({ body: createGuestRequestSchema }),
  controller.createGuest,
);
profileRouter.get('/me', requireAuth, controller.getMe);
profileRouter.patch(
  '/me',
  requireAuth,
  validate({ body: updateMeRequestSchema }),
  controller.updateMe,
);
profileRouter.delete('/dev/reset', requireAuth, allowDemoReset, controller.reset);
profileRouter.get('/me/collection', requireAuth, controller.collection);
profileRouter.get(
  '/vocabulary/:id',
  requireAuth,
  validate({ params: vocabularyParamsSchema }),
  controller.getVocabulary,
);
