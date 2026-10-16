import type { RequestHandler } from 'express';
import { checkHealth } from '../services/health.service';

export const getHealth: RequestHandler = async (_req, res) => {
  res.json({ success: true, data: await checkHealth() });
};
