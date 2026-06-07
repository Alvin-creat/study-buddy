import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 10002, message: 'Unauthorized' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, isBanned: true, role: true },
    });

    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({ code: 10006, message: 'Account disabled' });
    }

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ code: 10002, message: 'Invalid token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      req.userId = payload.userId;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

export async function requireVerified(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ code: 10002, message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { verifyStatus: true },
  });

  if (user?.verifyStatus !== 'VERIFIED') {
    return res.status(403).json({
      code: 10007,
      message: 'Real-name verification required',
    });
  }

  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ code: 10003, message: 'Admin only' });
  }
  next();
}
