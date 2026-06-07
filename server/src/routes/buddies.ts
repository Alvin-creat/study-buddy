import { Router } from 'express';
import { authMiddleware, requireVerified } from '../middleware/auth';
import * as buddyCtrl from '../controllers/buddies';

const router = Router();
router.use(authMiddleware, requireVerified);

router.get('/', buddyCtrl.getBuddies);
router.get('/:id', buddyCtrl.getBuddyDetail);
router.post('/:id/end', buddyCtrl.endBuddyship);

export { router as buddyRoutes };
