import { PrismaClient } from '@prisma/client';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { setVerificationCode, verifyCode, checkSendLimit, recordSendAttempt } from '../utils/redis';
import type { JwtPayload } from '../types';

const prisma = new PrismaClient();

// ─── Token Helpers ─────────────────────────

function generateTokens(payload: JwtPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 900,
  };
}

// ─── Send Verification Code ────────────────

interface SendCodeInput {
  phone: string;
}

export async function sendVerificationCode(input: SendCodeInput) {
  const phone = input.phone;

  // Rate limit check
  const limit = await checkSendLimit(phone);
  if (!limit.allowed) {
    throw new AppError(429, 42901, limit.reason || 'Rate limited');
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Redis (5min TTL)
  await setVerificationCode(phone, code);

  // Record attempt for rate limiting
  await recordSendAttempt(phone);

  // In production: send SMS via provider (Twilio / Aliyun SMS)
  // For dev: log the code
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Verification code for ${phone}: ${code}`);
  }

  return { phone, masked: phone.slice(0, 3) + '****' + phone.slice(-3) };
}

// ─── Login / Auto-Register ─────────────────

interface LoginInput {
  phone: string;
  code: string;
  nickname?: string;
  timezone?: string;
  language?: string;
}

export async function login(input: LoginInput) {
  const { phone, code, nickname, timezone, language } = input;

  // Verify the code
  const valid = await verifyCode(phone, code);
  if (!valid) {
    throw new AppError(401, 40101, 'Invalid or expired verification code');
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    // Auto-register
    user = await prisma.user.create({
      data: {
        phone,
        nickname: nickname || `User-${phone.slice(-4)}`,
        timezone: timezone || 'UTC',
        languages: language ? [language] : [],
      },
    });
  } else if (user.isBanned) {
    throw new AppError(403, 10006, 'Account is banned');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens({ userId: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      phone: user.phone,
      country: user.country,
      timezone: user.timezone,
      verifyStatus: user.verifyStatus,
      examType: user.examType,
      examName: user.examName,
      targetSchool: user.targetSchool,
      studyTime: user.studyTime,
      languages: user.languages,
      bio: user.bio,
    },
    ...tokens,
  };
}

// ─── Refresh Tokens ────────────────────────

export async function refreshTokens(token: string) {
  try {
    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, isBanned: true, role: true },
    });

    if (!user || !user.isActive || user.isBanned) {
      throw new AppError(401, 10006, 'Account disabled');
    }

    return generateTokens({ userId: user.id, role: user.role });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 10002, 'Invalid refresh token');
  }
}
