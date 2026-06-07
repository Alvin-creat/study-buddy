import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

const prisma = new PrismaClient();

// Simple translation function using a configured API endpoint
async function translateText(text: string, targetLang: string): Promise<string> {
  if (!config.translationApiKey) {
    // Dev fallback: return a placeholder
    return `[${targetLang}] ${text}`;
  }
  try {
    const resp = await fetch(config.translationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.translationApiKey}`,
      },
      body: JSON.stringify({ text, target: targetLang }),
    });
    const data = await resp.json() as any;
    return data.translatedText || data.text || text;
  } catch {
    throw new AppError(502, 50000, 'Translation service unavailable');
  }
}

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

export async function translateMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { buddyshipId, messageId } = req.params;
    const targetLang = (req.query.lang as string) || 'en';

    // Verify the message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        buddyship: { select: { userAId: true, userBId: true } },
      },
    });

    if (!message) throw new AppError(404, 40401, 'Message not found');
    if (message.buddyship.userAId !== req.userId! && message.buddyship.userBId !== req.userId!) {
      throw new AppError(403, 10003, 'Not your message');
    }

    // Return cached translation if exists
    if (message.contentEn) {
      return res.json({ code: 0, message: 'ok', data: { translated: message.contentEn, cached: true } });
    }

    // Translate and cache
    const translated = await translateText(message.content, targetLang);

    await prisma.message.update({
      where: { id: messageId },
      data: { contentEn: translated },
    });

    res.json({ code: 0, message: 'ok', data: { translated, cached: false } });
  } catch (err) {
    next(err);
  }
}
