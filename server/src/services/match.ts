import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// ─── Matching Algorithm ───────────────────

const TIMEZONE_COMPAT: Record<string, Record<string, number>> = {
  // Pre-computed timezone compatibility scores
  'Asia/Shanghai': { 'Asia/Tokyo': 0.85, 'Asia/Seoul': 0.85, 'Asia/Singapore': 1.0, 'Asia/Kolkata': 0.4 },
  'Asia/Tokyo': { 'Asia/Shanghai': 0.85, 'Asia/Seoul': 1.0, 'Asia/Singapore': 0.8, 'Asia/Kolkata': 0.35 },
};

function getTimezoneCompat(tz1: string, tz2: string): number {
  if (tz1 === tz2) return 1.0;
  // Compute based on UTC offset difference
  try {
    const d1 = new Date().toLocaleString('en-US', { timeZone: tz1 });
    const d2 = new Date().toLocaleString('en-US', { timeZone: tz2 });
    const diff = Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / 3600000;
    return Math.max(0, 1 - diff / 12); // Normalize: 0h diff=1.0, 12h diff=0
  } catch {
    return 0.5;
  }
}

function getScheduleOverlap(t1: string | null, t2: string | null): number {
  if (!t1 || !t2) return 0.5;
  const order = ['morning', 'afternoon', 'evening', 'night'];
  const i1 = order.indexOf(t1);
  const i2 = order.indexOf(t2);
  if (i1 === -1 || i2 === -1) return 0.5;
  return 1 - Math.abs(i1 - i2) / (order.length - 1);
}

function getLanguageOverlap(langs1: string[], langs2: string[]): number {
  if (!langs1.length || !langs2.length) return 0.5;
  const set2 = new Set(langs2);
  const overlap = langs1.filter((l) => set2.has(l)).length;
  return overlap / Math.max(langs1.length, langs2.length);
}

function computeMatchScore(
  examMatch: number,
  timezoneCompat: number,
  scheduleOverlap: number,
  languageOverlap: number,
  avgRating: number
): number {
  // Weighted scoring
  return (
    examMatch * 0.35 +
    timezoneCompat * 0.25 +
    scheduleOverlap * 0.20 +
    languageOverlap * 0.15 +
    (avgRating / 5) * 0.05
  );
}

// ─── Recommend Buddies ────────────────────

export async function recommend(
  userId: string,
  examId: string,
  page: number,
  pageSize: number
) {
  // Get current user's exam preferences
  const myExam = await prisma.userExam.findUnique({
    where: { userId_examId: { userId, examId } },
    include: { exam: true, user: true },
  });

  if (!myExam) {
    throw new AppError(400, 10001, 'You need to add this exam first');
  }

  const myUser = myExam.user;

  // Find candidates studying the same exam
  const candidates = await prisma.userExam.findMany({
    where: {
      examId,
      userId: { not: userId },
      isPublic: true,
      user: {
        verifyStatus: 'VERIFIED',
        isActive: true,
        isBanned: false,
      },
    },
    include: {
      user: {
        select: {
          id: true, nickname: true, avatar: true, country: true,
          timezone: true, languages: true,
          reviewsReceived: { select: { attitude: true, attendance: true, commSkill: true } },
        },
      },
      exam: { select: { id: true, name: true } },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Score and rank
  const scored = candidates.map((c) => {
    const reviews = c.user.reviewsReceived;
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.attitude + r.attendance + r.commSkill) / 3, 0) / reviews.length
      : 3.0;

    const examMatch = c.targetOrg === myExam.targetOrg ? 0.95
      : c.major === myExam.major ? 0.85
      : c.examId === examId ? 0.75 : 0.5;

    const timezoneCompat = getTimezoneCompat(myUser.timezone || 'UTC', c.user.timezone || 'UTC');
    const scheduleOverlap = getScheduleOverlap(myExam.preferredTime, c.preferredTime);
    const languageOverlap = getLanguageOverlap(myUser.languages, c.user.languages);

    const matchScore = computeMatchScore(
      examMatch, timezoneCompat, scheduleOverlap, languageOverlap, avgRating
    );

    return {
      userId: c.user.id,
      nickname: c.user.nickname,
      avatar: c.user.avatar,
      country: c.user.country,
      timezone: c.user.timezone,
      languages: c.user.languages,
      matchScore: Math.round(matchScore * 100) / 100,
      matchDetails: {
        examMatch: Math.round(examMatch * 100) / 100,
        timezoneCompat: Math.round(timezoneCompat * 100) / 100,
        scheduleOverlap: Math.round(scheduleOverlap * 100) / 100,
        languageOverlap: Math.round(languageOverlap * 100) / 100,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      exam: { id: c.exam.id, name: c.exam.name },
      userExam: {
        targetScore: c.targetScore,
        targetOrg: c.targetOrg,
        major: c.major,
        dailyHours: c.dailyHours,
        preferredTime: c.preferredTime,
      },
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  const total = await prisma.userExam.count({
    where: {
      examId,
      userId: { not: userId },
      isPublic: true,
      user: { verifyStatus: 'VERIFIED', isActive: true, isBanned: false },
    },
  });

  return {
    data: scored,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ─── Search Buddies ───────────────────────

export async function search(userId: string, filters: any) {
  const { examId, country, language, timezone, dailyHoursMin, dailyHoursMax, page = '1', pageSize = '20' } = filters;

  if (!examId) {
    throw new AppError(400, 10001, 'examId required');
  }

  const where: any = {
    examId,
    userId: { not: userId },
    isPublic: true,
    user: { verifyStatus: 'VERIFIED', isActive: true, isBanned: false },
  };

  if (country) where.user.country = country;
  if (language) where.user.languages = { has: language };
  if (dailyHoursMin) where.dailyHours = { ...where.dailyHours, gte: parseInt(dailyHoursMin, 10) };
  if (dailyHoursMax) where.dailyHours = { ...where.dailyHours, lte: parseInt(dailyHoursMax, 10) };

  const [candidates, total] = await Promise.all([
    prisma.userExam.findMany({
      where,
      include: {
        user: { select: { id: true, nickname: true, avatar: true, country: true, timezone: true, languages: true } },
        exam: { select: { id: true, name: true } },
      },
      skip: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
      take: parseInt(pageSize, 10),
    }),
    prisma.userExam.count({ where }),
  ]);

  return {
    data: candidates.map((c) => ({
      userId: c.user.id,
      nickname: c.user.nickname,
      avatar: c.user.avatar,
      country: c.user.country,
      timezone: c.user.timezone,
      languages: c.user.languages,
      exam: { id: c.exam.id, name: c.exam.name },
      userExam: {
        targetScore: c.targetScore,
        targetOrg: c.targetOrg,
        major: c.major,
        dailyHours: c.dailyHours,
        preferredTime: c.preferredTime,
      },
    })),
    pagination: { page: parseInt(page, 10), pageSize: parseInt(pageSize, 10), total, totalPages: Math.ceil(total / parseInt(pageSize, 10)) },
  };
}

// ─── Buddy Requests ───────────────────────

export async function sendRequest(userId: string, input: {
  targetId: string;
  examId: string;
  message?: string;
}) {
  if (input.targetId === userId) {
    throw new AppError(400, 10001, 'Cannot send request to yourself');
  }

  const existing = await prisma.buddyRequest.findUnique({
    where: {
      requesterId_targetId_examId: {
        requesterId: userId,
        targetId: input.targetId,
        examId: input.examId,
      },
    },
  });

  if (existing) {
    throw new AppError(409, 10001, 'Request already exists');
  }

  return prisma.buddyRequest.create({
    data: {
      requesterId: userId,
      targetId: input.targetId,
      examId: input.examId,
      message: input.message || null,
    },
  });
}

export async function getRequests(userId: string, direction: 'sent' | 'received') {
  const where = direction === 'sent'
    ? { requesterId: userId }
    : { targetId: userId, status: 'PENDING' as const };

  return prisma.buddyRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, nickname: true, avatar: true, country: true } },
      target: { select: { id: true, nickname: true, avatar: true, country: true } },
      exam: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function acceptRequest(userId: string, requestId: string) {
  const request = await prisma.buddyRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.targetId !== userId) {
    throw new AppError(404, 10004, 'Request not found');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(400, 10001, 'Request already processed');
  }

  // Create buddyship and update request in a transaction
  const [buddyship] = await prisma.$transaction([
    prisma.buddyship.create({
      data: {
        userAId: request.requesterId,
        userBId: request.targetId,
        examId: request.examId,
      },
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
    throw new AppError(404, 10004, 'Request not found');
  }

  await prisma.buddyRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });
}
