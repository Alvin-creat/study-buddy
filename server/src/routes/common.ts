import { Router } from 'express';
import * as commonCtrl from '../controllers/common';

const router = Router();

router.post('/upload', commonCtrl.upload);
router.post('/translate', commonCtrl.translate);
router.get('/countries', commonCtrl.getCountries);
router.get('/timezones', commonCtrl.getTimezones);
router.post('/report', commonCtrl.report);

export { router as commonRoutes };
