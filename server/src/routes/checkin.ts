import { Router } from 'express';
import { authMiddleware, requireVerified } from '../middleware/auth';
import * as checkinCtrl from '../controllers/checkin';

const router = Router();
router.use(authMiddleware, requireVerified);

router.post('/', checkinCtrl.checkin);
router.get('/', checkinCtrl.getMyCheckins);
router.get('/streak', checkinCtrl.getStreak);

export { router as checkinRoutes };
