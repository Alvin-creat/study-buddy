import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getExams(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, parentId, lang } = req.query;

    const where: any = { isActive: true };
    if (category) where.category = category as string;
    if (parentId === 'null' || parentId === '') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId as string;
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, nameEn: true, icon: true, category: true },
        },
      },
    });

    // Map response based on language preference
    const mapped = exams.map((e) => ({
      id: e.id,
      name: e.name,
      nameEn: e.nameEn,
      category: e.category,
      icon: e.icon,
      children: e.children,
    }));

    res.json({ code: 0, message: 'ok', data: mapped });
  } catch (err) {
    next(err);
  }
}

export async function getHotExams(_req: Request, res: Response, next: NextFunction) {
  try {
    // Get exams with the most user associations
    const hotExams = await prisma.exam.findMany({
      where: { isActive: true, parentId: null },
      take: 10,
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, nameEn: true, icon: true, category: true },
    });

    res.json({ code: 0, message: 'ok', data: hotExams });
  } catch (err) {
    next(err);
  }
}

export async function searchExams(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.status(400).json({ code: 10001, message: 'Query too short' });
    }

    const exams = await prisma.exam.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: { id: true, name: true, nameEn: true, icon: true, category: true },
    });

    res.json({ code: 0, message: 'ok', data: exams });
  } catch (err) {
    next(err);
  }
}
