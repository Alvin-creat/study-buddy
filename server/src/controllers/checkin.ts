import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkin(req: Request, res: Response, next: NextFunction) {
  try {
    const { examId, duration, content, images } = req.body;

    const record = await prisma.checkin.create({
      data: {
        userId: req.userId!,
        examId: examId || null,
        duration,
        content: content || null,
        images: images || [],
      },
    });

    res.status(201).json({ code: 0, message: 'ok', data: record });
  } catch (err) {
    next(err);
  }
}

export async function getMyCheckins(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, examId } = req.query;

    const where: any = { userId: req.userId! };
    if (startDate && endDate) {
      where.checkedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    if (examId) where.examId = examId;

    const records = await prisma.checkin.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      include: { exam: { select: { id: true, name: true } } },
    });

    res.json({ code: 0, message: 'ok', data: records });
  } catch (err) {
    next(err);
  }
}

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    // Count consecutive days with checkins
    const records = await prisma.checkin.findMany({
      where: { userId: req.userId! },
      orderBy: { checkedAt: 'desc' },
      select: { checkedAt: true },
      take: 365,
    });

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    const checkinDates = new Set(
      records.map((r) => {
        const d = new Date(r.checkedAt);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })
    );

    while (checkinDates.has(current.toISOString()) || streak === 0) {
      if (checkinDates.has(current.toISOString())) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else if (streak > 0) {
        break;
      } else {
        current.setDate(current.getDate() - 1);
      }
    }

    res.json({ code: 0, message: 'ok', data: { streak } });
  } catch (err) {
    next(err);
  }
}
