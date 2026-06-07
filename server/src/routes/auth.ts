import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import * as authCtrl from '../controllers/auth';

const router = Router();
router.use(authLimiter);

const sendCodeSchema = z.object({
  phone: z.string().min(6).max(20),
});

const loginSchema = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().length(6),
  nickname: z.string().min(1).max(50).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

router.post('/send-code', validate(sendCodeSchema), authCtrl.sendCode);
router.post('/login', validate(loginSchema), authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authCtrl.logout);

export { router as authRoutes };
