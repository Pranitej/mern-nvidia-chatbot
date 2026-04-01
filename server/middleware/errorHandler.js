import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({ method: req.method, url: req.originalUrl, status, err: message, stack: err.stack }, 'unhandled_error');

  res.status(status).json({
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}
