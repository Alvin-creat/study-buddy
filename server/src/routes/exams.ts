import { Router } from 'express';
import * as examCtrl from '../controllers/exams';

const router = Router();

router.get('/', examCtrl.getExams);
router.get('/hot', examCtrl.getHotExams);
router.get('/search', examCtrl.searchExams);

export { router as examRoutes };
