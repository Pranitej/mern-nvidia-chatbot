import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

function createLimiter(key) {
  const { windowMs, max } = config.rateLimit[key];
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
}

export const authLimiter   = createLimiter('auth');
export const apiLimiter    = createLimiter('api');
export const streamLimiter = createLimiter('stream');
