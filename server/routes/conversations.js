import { Router } from 'express';
import { listConversations, createConversation, renameConversation, deleteConversation } from '../controllers/conversationController.js';
import { listMessages } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(requireAuth, apiLimiter);

router.get('/',          listConversations);
router.post('/',         createConversation);
router.patch('/:id',     renameConversation);
router.delete('/:id',    deleteConversation);
router.get('/:id/messages', listMessages);

export default router;
