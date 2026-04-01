import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***@') }, 'mongodb:connected');
  } catch (err) {
    logger.fatal({ err: err.message }, 'mongodb:connection_failed');
    process.exit(1);
  }
}
