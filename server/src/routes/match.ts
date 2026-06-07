import { Router } from 'express';
import { authMiddleware, requireVerified } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import * as matchCtrl from '../controllers/match';

const router = Router();
router.use(authMiddleware, requireVerified);

const requestSchema = z.object({
  targetId: z.string(),
  examId: z.string(),
  message: z.string().max(500).optional(),
});

router.get('/recommend', matchCtrl.recommend);
router.get('/search', matchCtrl.search);
router.post('/request', validate(requestSchema), matchCtrl.sendRequest);
router.get('/requests/received', matchCtrl.receivedRequests);
router.get('/requests/sent', matchCtrl.sentRequests);
router.post('/requests/:id/accept', matchCtrl.acceptRequest);
router.post('/requests/:id/reject', matchCtrl.rejectRequest);

export { router as matchRoutes };
