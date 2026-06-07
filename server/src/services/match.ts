import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// ─── List Matches (Card Waterfall) ──────────

interface MatchFilters {
  examType?: string;      // postgraduate / certificate / language / other
  keyword?: string;       // search exam_name, target_school, nickname
  timezone?: string;       // filter by timezone
  page?: number;
  limit?: number;
}

export async function listMatches(userId: string, filters: MatchFilters) {
  const { examType, keyword, timezone, page = 1, limit = 20 } = filters;

  const where: any = {
    id: { not: userId },
    isActive: true,
    isBanned: false,
  };

  if (examType) {
    where.examType = examType;
  }

  if (timezone) {
    where.timezone = timezone;
  }

  if (keyword) {
    where.OR = [
      { examName: { contains: keyword, mode: 'insensitive' } },
      { targetSchool: { contains: keyword, mode: 'insensitive' } },
      { nickname: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, nickname: true, avatar: true,
        country: true, timezone: true, languages: true,
        examType: true, examName: true, targetSchool: true,
        studyTime: true, bio: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: { page, pageSize: limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Send Greeting (Buddy Request) ──────────

export async function sendRequest(userId: string, targetId: string, message?: string) {
  if (targetId === userId) {
    throw new AppError(400, 40001, 'Cannot send request to yourself');
  }

  // Check target exists
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) {
    throw new AppError(404, 40401, 'User not found');
  }

  // Check existing pending request
  const existing = await prisma.buddyRequest.findFirst({
    where: {
      requesterId: userId,
      targetId,
      status: 'PENDING',
    },
  });

  if (existing) {
    // Also check reverse direction (already received from target)
    const reverse = await prisma.buddyRequest.findFirst({
      where: {
        requesterId: targetId,
        targetId: userId,
        status: 'PENDING',
      },
    });
    if (reverse) {
      // Auto-accept: create buddyship directly
      const [buddyship] = await prisma.$transaction([
        prisma.buddyship.create({
          data: { userAId: userId, userBId: targetId },
        }),
        prisma.buddyRequest.update({
          where: { id: reverse.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        }),
        prisma.buddyRequest.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        }),
      ]);
      return { matched: true, buddyshipId: buddyship.id };
    }

    throw new AppError(409, 40001, 'Request already sent');
  }

  const request = await prisma.buddyRequest.create({
    data: { requesterId: userId, targetId, message },
  });

  return { matched: false, requestId: request.id };
}

// ─── Get Requests (combined sent + received) ──

export async function getRequests(userId: string) {
  const [received, sent] = await Promise.all([
    prisma.buddyRequest.findMany({
      where: { targetId: userId, status: 'PENDING' },
      include: {
        requester: {
          select: { id: true, nickname: true, avatar: true, country: true, timezone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.buddyRequest.findMany({
      where: { requesterId: userId },
      include: {
        target: {
          select: { id: true, nickname: true, avatar: true, country: true, timezone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { received, sent };
}

// ─── Accept / Reject Request ────────────────

export async function acceptRequest(userId: string, requestId: string) {
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.targetId !== userId) {
    throw new AppError(404, 40401, 'Request not found');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(400, 40001, 'Request already processed');
  }

  const [buddyship] = await prisma.$transaction([
    prisma.buddyship.create({
      data: { userAId: request.requesterId, userBId: request.targetId },
    }),
    prisma.buddyRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    }),
  ]);

  return buddyship;
}

export async function rejectRequest(userId: string, requestId: string) {
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.targetId !== userId) {
    throw new AppError(404, 40401, 'Request not found');
  }

  await prisma.buddyRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });
}

// ─── Get Connections ────────────────────────

export async function getConnections(userId: string) {
  const buddyships = await prisma.buddyship.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
      status: 'ACTIVE',
    },
    include: {
      userA: {
        select: { id: true, nickname: true, avatar: true, country: true, timezone: true },
      },
      userB: {
        select: { id: true, nickname: true, avatar: true, country: true, timezone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return buddyships.map((b) => {
    const partner = b.userAId === userId ? b.userB : b.userA;
    return {
      buddyshipId: b.id,
      partner,
      startedAt: b.startedAt,
    };
  });
}
