import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import type { JwtPayload } from '../types';

const prisma = new PrismaClient();

interface RegisterInput {
  type: 'email' | 'phone';
  email?: string;
  phone?: string;
  phoneCode?: string;
  password: string;
  nickname: string;
  country?: string;
  timezone?: string;
  language?: string;
}

interface LoginInput {
  type: 'email' | 'phone';
  email?: string;
  phone?: string;
  phoneCode?: string;
  password: string;
}

function generateTokens(payload: JwtPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 900, // 15 minutes in seconds
  };
}

export async function register(input: RegisterInput) {
  const existing = input.type === 'email'
    ? await prisma.user.findUnique({ where: { email: input.email } })
    : await prisma.user.findUnique({ where: { phone: input.phone } });

  if (existing) {
    throw new AppError(409, 20001, 'Account already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email || null,
      phone: input.phone || null,
      phoneCode: input.phoneCode || null,
      passwordHash,
      nickname: input.nickname,
      country: input.country || null,
      timezone: input.timezone || 'UTC',
      languages: input.language ? [input.language] : [],
    },
    select: {
      id: true, nickname: true, avatar: true, email: true, phone: true,
      country: true, timezone: true, verifyStatus: true, createdAt: true,
    },
  });

  const tokens = generateTokens({ userId: user.id, role: 'USER' });

  return { user, ...tokens };
}

export async function login(input: LoginInput) {
  const user = input.type === 'email'
    ? await prisma.user.findUnique({ where: { email: input.email } })
    : await prisma.user.findUnique({ where: { phone: input.phone } });

  if (!user) {
    throw new AppError(401, 20002, 'Invalid credentials');
  }

  if (user.isBanned) {
    throw new AppError(403, 10006, 'Account is banned');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 20002, 'Invalid credentials');
  }

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
      email: user.email,
      phone: user.phone,
      country: user.country,
      timezone: user.timezone,
      verifyStatus: user.verifyStatus,
    },
    ...tokens,
  };
}

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

export async function sendVerificationCode(input: {
  type: 'email' | 'phone';
  email?: string;
  phone?: string;
  phoneCode?: string;
}) {
  // In production: generate code, store in Redis with TTL, send via SMS/email provider
  // For now, log the code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[DEV] Verification code for ${input.email || input.phone}: ${code}`);
  return true;
}
