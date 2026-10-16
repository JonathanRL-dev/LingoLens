import type { Request, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import * as scan from '../services/scan.service';
import { getSessionExercises } from '../services/exercise-session.service';
import * as answers from '../services/answer.service';
import * as pronunciation from '../services/pronunciation.service';

function userId(req: Request): string {
  if (!req.user) throw new AppError('UNAUTHORIZED', 'Autentikasi tidak sah');
  return req.user.id;
}
export const scanAttempt: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await scan.createScanAttempt(userId(req), String(req.params.sid), req.body),
  });
};
export const exercises: RequestHandler = async (req, res) => {
  const session = await scan.requireScannedSession(userId(req), String(req.params.sid));
  const data = await getSessionExercises(session);
  res.json({ success: true, data: { exercises: data.exercises } });
};
export const answer: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await answers.submitExerciseAnswer(
      userId(req),
      String(req.params.sid),
      String(req.params.eid),
      req.body.answer,
    ),
  });
};
export const pronunciationAttempt: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await pronunciation.submitPronunciation(userId(req), String(req.params.sid), req.body),
  });
};
