import { Router } from 'express';
import { register, login, refresh, logout, getMe, checkEmail, updateProfile, updatePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.post('/refresh',  refresh);
router.post('/logout',   logout);
router.get('/me',        requireAuth, getMe);
router.get('/check-email', authLimiter, requireAuth, checkEmail);
router.put('/profile',    authLimiter, requireAuth, updateProfile);
router.put('/password',   authLimiter, requireAuth, updatePassword);

export default router;
