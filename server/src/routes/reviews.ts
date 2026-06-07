import { Router } from 'express';
import { authMiddleware, requireVerified } from '../middleware/auth';
import * as reviewCtrl from '../controllers/reviews';

const router = Router();
router.use(authMiddleware, requireVerified);

router.post('/', reviewCtrl.createReview);
router.get('/user/:userId', reviewCtrl.getUserReviews);

export { router as reviewRoutes };
