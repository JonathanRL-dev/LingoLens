import { env } from '../lib/env';

export const GLOBAL_LIMIT = { windowMs: 60 * 1000, max: env.GLOBAL_RATE_LIMIT_PER_MINUTE } as const;
export const STRICT_LIMIT = { windowMs: 60 * 1000, max: 60 } as const;
