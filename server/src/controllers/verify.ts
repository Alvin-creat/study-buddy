import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function uploadIdCard(req: Request, res: Response, next: NextFunction) {
  try {
    // In production: handle multipart upload via multer, send to OCR API
    // For now, accept image URLs
    const { idType, idCardFront, idCardBack, name, idNumber } = req.body;

    if (!idType || !idCardFront || !name || !idNumber) {
      throw new AppError(400, 10001, 'idType, idCardFront, name, and idNumber are required');
    }

    const existing = await prisma.verification.findUnique({
      where: { userId: req.userId! },
    });

    if (existing && ['PENDING', 'VERIFIED'].includes(existing.status)) {
      throw new AppError(409, 10001, 'Verification already submitted or approved');
    }

    const verification = await prisma.verification.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        idType,
        idCardFront,
        idCardBack: idCardBack || null,
        selfieImage: '', // Will be set in face upload step
        name,
        idNumber,
        status: 'PENDING',
      },
      update: {
        idType,
        idCardFront,
        idCardBack: idCardBack || null,
        name,
        idNumber,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    res.status(201).json({ code: 0, message: 'ok', data: verification });
  } catch (err) {
    next(err);
  }
}

export async function uploadFace(req: Request, res: Response, next: NextFunction) {
  try {
    const { selfieImage } = req.body;

    if (!selfieImage) {
      throw new AppError(400, 10001, 'selfieImage required');
    }

    const verification = await prisma.verification.findUnique({
      where: { userId: req.userId! },
    });

    if (!verification) {
      throw new AppError(404, 10004, 'Please upload ID card first');
    }

    // In production: call face comparison API (Stripe Identity / Aliyun)
    const faceScore = 0.95; // Placeholder

    const updated = await prisma.verification.update({
      where: { userId: req.userId! },
      data: { selfieImage, faceScore },
    });

    // If score is high enough, auto-approve
    if (faceScore > 0.85) {
      await prisma.user.update({
        where: { id: req.userId! },
        data: { verifyStatus: 'VERIFIED' },
      });
      await prisma.verification.update({
        where: { userId: req.userId! },
        data: { status: 'VERIFIED', reviewedAt: new Date() },
      });
    }

    res.json({ code: 0, message: 'ok', data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const verification = await prisma.verification.findUnique({
      where: { userId: req.userId! },
      select: { status: true, submittedAt: true, reviewedAt: true, rejectReason: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { verifyStatus: true },
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        verifyStatus: user?.verifyStatus || 'UNVERIFIED',
        verification: verification || null,
      },
    });
  } catch (err) {
    next(err);
  }
}
