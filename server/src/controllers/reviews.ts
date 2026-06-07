import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { buddyshipId, revieweeId, attitude, attendance, commSkill, comment, tags } = req.body;

    // Verify the buddyship is real and ended
    const buddyship = await prisma.buddyship.findUnique({
      where: { id: buddyshipId },
      select: { userAId: true, userBId: true, status: true },
    });

    if (!buddyship) throw new AppError(404, 10004, 'Buddyship not found');
    if (buddyship.userAId !== req.userId! && buddyship.userBId !== req.userId!) {
      throw new AppError(403, 10003, 'Not your buddyship');
    }

    // Check for duplicate
    const existing = await prisma.review.findUnique({
      where: { reviewerId_buddyshipId: { reviewerId: req.userId!, buddyshipId } },
    });
    if (existing) {
      throw new AppError(409, 10001, 'You already reviewed this buddyship');
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: req.userId!,
        revieweeId,
        buddyshipId,
        attitude,
        attendance,
        commSkill,
        comment: comment || null,
        tags: tags || [],
      },
    });

    res.status(201).json({ code: 0, message: 'ok', data: review });
  } catch (err) {
    next(err);
  }
}

export async function getUserReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.userId },
      include: {
        reviewer: { select: { id: true, nickname: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 0, message: 'ok', data: reviews });
  } catch (err) {
    next(err);
  }
}
