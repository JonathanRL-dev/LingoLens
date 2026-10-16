import type { Request } from 'express';
import { AppError } from '../lib/errors';
import * as profile from '../services/profile.service';
import * as vocabulary from '../services/vocabulary.service';
import type { RequestHandler } from 'express';

function userId(req: Request): string {
  if (!req.user) throw new AppError('UNAUTHORIZED', 'Autentikasi tidak sah');
  return req.user.id;
}
export const createGuest: RequestHandler = async (req, res) => {
  res.status(201).json({ success: true, data: await profile.createGuest(req.body.nickname) });
};
export const getMe: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await profile.getProfile(userId(req)) });
};
export const updateMe: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await profile.updateProfile(userId(req), req.body) });
};
export const reset: RequestHandler = async (req, res) => {
  await profile.resetProfile(userId(req));
  res.status(204).end();
};
export const collection: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await vocabulary.getCollection(userId(req)) });
};
export const getVocabulary: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await vocabulary.getVocabulary(userId(req), Number(req.params.id)),
  });
};
