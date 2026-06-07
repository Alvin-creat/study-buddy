import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { z } from 'zod';
import * as userCtrl from '../controllers/users';

const router = Router();

const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthday: z.string().datetime().optional(),
  bio: z.string().max(500).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).optional(),
  examType: z.string().optional(),
  examName: z.string().optional(),
  targetSchool: z.string().optional(),
  studyTime: z.string().optional(),
  privacySettings: z.object({
    showExam: z.boolean().optional(),
    showCheckin: z.boolean().optional(),
    showContact: z.boolean().optional(),
    showReviews: z.boolean().optional(),
  }).optional(),
});

const addExamSchema = z.object({
  examId: z.string(),
  targetScore: z.string().optional(),
  targetOrg: z.string().optional(),
  major: z.string().optional(),
  dailyHours: z.number().int().min(1).max(16).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  isPrimary: z.boolean().optional(),
});

router.get('/me', authMiddleware, userCtrl.getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), userCtrl.updateProfile);
router.get('/me/exams', authMiddleware, userCtrl.getMyExams);
router.post('/me/exams', authMiddleware, validate(addExamSchema), userCtrl.addExam);
router.put('/me/exams/:examId', authMiddleware, userCtrl.updateExam);
router.delete('/me/exams/:examId', authMiddleware, userCtrl.removeExam);
router.get('/:id', optionalAuth, userCtrl.getUser);

export { router as userRoutes };
