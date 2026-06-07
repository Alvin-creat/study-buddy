import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import * as matchCtrl from '../controllers/match';

const router = Router();
router.use(authMiddleware);

const greetSchema = z.object({
  message: z.string().max(200).optional(),
});

const respondSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

router.get('/', matchCtrl.listMatches);
router.post('/:userId/greet', validate(greetSchema), matchCtrl.greet);
router.get('/requests', matchCtrl.getRequests);
router.patch('/requests/:id', validate(respondSchema), matchCtrl.handleRequest);
router.get('/connections', matchCtrl.getConnections);

export { router as matchRoutes };
