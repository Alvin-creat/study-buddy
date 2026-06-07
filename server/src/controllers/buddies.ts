import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function getBuddies(req: Request, res: Response, next: NextFunction) {
  try {
    const buddies = await prisma.buddyship.findMany({
      where: {
        OR: [{ userAId: req.userId! }, { userBId: req.userId! }],
        status: 'ACTIVE',
      },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true, country: true, timezone: true } },
        userB: { select: { id: true, nickname: true, avatar: true, country: true, timezone: true } },
        exam: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = buddies.map((b) => {
      const isUserA = b.userAId === req.userId;
      return {
        id: b.id,
        buddy: isUserA ? b.userB : b.userA,
        exam: b.exam,
        lastMessage: b.messages[0] || null,
        startedAt: b.startedAt,
      };
    });

    res.json({ code: 0, message: 'ok', data: mapped });
  } catch (err) {
    next(err);
  }
}

export async function getBuddyDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const buddyship = await prisma.buddyship.findUnique({
      where: { id: req.params.id },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true, country: true } },
        userB: { select: { id: true, nickname: true, avatar: true, country: true } },
        exam: { select: { id: true, name: true } },
      },
    });

    if (!buddyship) throw new AppError(404, 10004, 'Buddyship not found');
    if (buddyship.userAId !== req.userId && buddyship.userBId !== req.userId) {
      throw new AppError(403, 10003, 'Not your buddyship');
    }

    res.json({ code: 0, message: 'ok', data: buddyship });
  } catch (err) {
    next(err);
  }
}

export async function endBuddyship(req: Request, res: Response, next: NextFunction) {
  try {
    const buddyship = await prisma.buddyship.findUnique({
      where: { id: req.params.id },
    });

    if (!buddyship) throw new AppError(404, 10004, 'Buddyship not found');
    if (buddyship.userAId !== req.userId && buddyship.userBId !== req.userId) {
      throw new AppError(403, 10003, 'Not your buddyship');
    }

    await prisma.buddyship.update({
      where: { id: req.params.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    res.json({ code: 0, message: 'Buddyship ended' });
  } catch (err) {
    next(err);
  }
}
