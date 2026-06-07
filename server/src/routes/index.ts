import { Router } from 'express';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { verifyRoutes } from './verify';
import { examRoutes } from './exams';
import { matchRoutes } from './match';
import { buddyRoutes } from './buddies';
import { chatRoutes } from './chat';
import { checkinRoutes } from './checkin';
import { reviewRoutes } from './reviews';
import { commonRoutes } from './common';
import { globalLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(globalLimiter);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/verify', verifyRoutes);
router.use('/exams', examRoutes);
router.use('/match', matchRoutes);
router.use('/buddies', buddyRoutes);
router.use('/chat', chatRoutes);
router.use('/checkin', checkinRoutes);
router.use('/reviews', reviewRoutes);
router.use('/common', commonRoutes);

export { router as routes };
