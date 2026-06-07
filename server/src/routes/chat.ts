import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as chatCtrl from '../controllers/chat';

const router = Router();
router.use(authMiddleware);

router.get('/rooms', chatCtrl.getRooms);
router.get('/rooms/:buddyshipId/messages', chatCtrl.getMessages);
router.post('/rooms/:buddyshipId/translate/:messageId', chatCtrl.translateMessage);

export { router as chatRoutes };
