import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import * as authCtrl from '../controllers/auth';

const router = Router();
router.use(authLimiter);

const registerSchema = z.object({
  type: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  phoneCode: z.string().optional(),
  password: z.string().min(8).max(64),
  nickname: z.string().min(1).max(50),
  country: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

const loginSchema = z.object({
  type: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  phoneCode: z.string().optional(),
  password: z.string(),
});

const sendCodeSchema = z.object({
  type: z.enum(['email', 'phone']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  phoneCode: z.string().optional(),
});

router.post('/register', validate(registerSchema), authCtrl.register);
router.post('/login', validate(loginSchema), authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/send-code', validate(sendCodeSchema), authCtrl.sendCode);
router.post('/logout', authCtrl.logout);

export { router as authRoutes };
