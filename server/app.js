import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/config.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import aiRoutes from './routes/ai.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start }, 'request');
  });
  next();
});

app.use('/api/auth',          authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/ai',            aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
