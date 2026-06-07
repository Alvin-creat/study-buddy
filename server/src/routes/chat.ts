import { Router } from 'express';
import { authMiddleware, requireVerified } from '../middleware/auth';
import * as chatCtrl from '../controllers/chat';

const router = Router();
router.use(authMiddleware, requireVerified);

router.get('/rooms', chatCtrl.getRooms);
router.get('/rooms/:buddyshipId/messages', chatCtrl.getMessages);

export { router as chatRoutes };
