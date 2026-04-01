import { Router } from 'express';
import { streamMessage } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { streamLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.post('/stream/:conversationId', requireAuth, streamLimiter, streamMessage);

export default router;
