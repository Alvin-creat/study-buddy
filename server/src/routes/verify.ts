import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as verifyCtrl from '../controllers/verify';

const router = Router();
router.use(authMiddleware);

router.post('/id-card', verifyCtrl.uploadIdCard);
router.post('/face', verifyCtrl.uploadFace);
router.get('/status', verifyCtrl.getStatus);

export { router as verifyRoutes };
