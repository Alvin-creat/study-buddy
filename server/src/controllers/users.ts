import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        userExams: { include: { exam: true } },
        verifications: { select: { id: true, status: true, submittedAt: true } },
      },
    });

    if (!user) throw new AppError(404, 10004, 'User not found');

    const { passwordHash, ...safeUser } = user;
    res.json({ code: 0, message: 'ok', data: safeUser });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, nickname: true, avatar: true, gender: true,
        country: true, region: true, timezone: true, languages: true,
        bio: true, verifyStatus: true, createdAt: true,
        userExams: {
          where: { isPublic: true },
          include: { exam: { select: { id: true, name: true, category: true } } },
        },
        reviewsReceived: {
          select: { attitude: true, attendance: true, commSkill: true, comment: true, tags: true },
        },
      },
    });

    if (!user) throw new AppError(404, 10004, 'User not found');

    res.json({ code: 0, message: 'ok', data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: req.body,
      select: {
        id: true, nickname: true, avatar: true, gender: true, bio: true,
        country: true, region: true, timezone: true, languages: true,
        privacySettings: true, updatedAt: true,
      },
    });
    res.json({ code: 0, message: 'ok', data: user });
  } catch (err) {
    next(err);
  }
}

export async function getMyExams(req: Request, res: Response, next: NextFunction) {
  try {
    const exams = await prisma.userExam.findMany({
      where: { userId: req.userId! },
      include: { exam: true },
      orderBy: { isPrimary: 'desc' },
    });
    res.json({ code: 0, message: 'ok', data: exams });
  } catch (err) {
    next(err);
  }
}

export async function addExam(req: Request, res: Response, next: NextFunction) {
  try {
    const exam = await prisma.userExam.create({
      data: { ...req.body, userId: req.userId! },
      include: { exam: true },
    });
    res.status(201).json({ code: 0, message: 'ok', data: exam });
  } catch (err) {
    next(err);
  }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const exam = await prisma.userExam.update({
      where: {
        userId_examId: { userId: req.userId!, examId: req.params.examId },
      },
      data: req.body,
      include: { exam: true },
    });
    res.json({ code: 0, message: 'ok', data: exam });
  } catch (err) {
    next(err);
  }
}

export async function removeExam(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.userExam.delete({
      where: {
        userId_examId: { userId: req.userId!, examId: req.params.examId },
      },
    });
    res.json({ code: 0, message: 'Exam removed' });
  } catch (err) {
    next(err);
  }
}
