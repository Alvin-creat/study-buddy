import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const buddyships = await prisma.buddyship.findMany({
      where: {
        OR: [{ userAId: req.userId! }, { userBId: req.userId! }],
        status: 'ACTIVE',
      },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true } },
        userB: { select: { id: true, nickname: true, avatar: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rooms = buddyships.map((b) => ({
      id: b.id,
      partner: b.userAId === req.userId! ? b.userA : b.userB,
      lastMessage: b.messages[0] || null,
      unreadCount: 0, // Computed separately in production
    }));

    res.json({ code: 0, message: 'ok', data: rooms });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { buddyshipId } = req.params;
    const { before, limit = '50' } = req.query;

    // Verify user belongs to this buddyship
    const buddyship = await prisma.buddyship.findUnique({
      where: { id: buddyshipId },
      select: { userAId: true, userBId: true },
    });

    if (!buddyship) throw new AppError(404, 10004, 'Buddyship not found');
    if (buddyship.userAId !== req.userId! && buddyship.userBId !== req.userId!) {
      throw new AppError(403, 10003, 'Not your chat room');
    }

    const where: any = { buddyshipId };
    if (before) {
      where.createdAt = { lt: new Date(before as string) };
    }

    const messages = await prisma.message.findMany({
      where,
      take: parseInt(limit as string, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    res.json({ code: 0, message: 'ok', data: messages.reverse() });
  } catch (err) {
    next(err);
  }
}
