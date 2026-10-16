import type { Request, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import * as missions from '../services/missionEndpoints.service';

function userId(req: Request): string {
  if (!req.user) throw new AppError('UNAUTHORIZED', 'Autentikasi tidak sah');
  return req.user.id;
}
export const list: RequestHandler = async (req, res) => {
  res.json({ success: true, data: await missions.listMissions(userId(req)) });
};
export const detail: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await missions.missionDetail(userId(req), Number(req.params.id)),
  });
};
export const startSession: RequestHandler = async (req, res) => {
  res.status(201).json({
    success: true,
    data: await missions.startMissionSession(userId(req), Number(req.params.id)),
  });
};
export const hint: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    data: await missions.requestHint(userId(req), String(req.params.sid)),
  });
};
