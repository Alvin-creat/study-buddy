import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Country codes and timezones data (abbreviated)
const COUNTRIES = [
  { code: 'CN', name: 'China', nameZh: '中国', phoneCode: '+86', timezones: ['Asia/Shanghai'] },
  { code: 'US', name: 'United States', nameZh: '美国', phoneCode: '+1', timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'] },
  { code: 'JP', name: 'Japan', nameZh: '日本', phoneCode: '+81', timezones: ['Asia/Tokyo'] },
  { code: 'KR', name: 'South Korea', nameZh: '韩国', phoneCode: '+82', timezones: ['Asia/Seoul'] },
  { code: 'GB', name: 'United Kingdom', nameZh: '英国', phoneCode: '+44', timezones: ['Europe/London'] },
  { code: 'FR', name: 'France', nameZh: '法国', phoneCode: '+33', timezones: ['Europe/Paris'] },
  { code: 'DE', name: 'Germany', nameZh: '德国', phoneCode: '+49', timezones: ['Europe/Berlin'] },
  { code: 'IN', name: 'India', nameZh: '印度', phoneCode: '+91', timezones: ['Asia/Kolkata'] },
  { code: 'SG', name: 'Singapore', nameZh: '新加坡', phoneCode: '+65', timezones: ['Asia/Singapore'] },
  { code: 'AU', name: 'Australia', nameZh: '澳大利亚', phoneCode: '+61', timezones: ['Australia/Sydney'] },
  { code: 'CA', name: 'Canada', nameZh: '加拿大', phoneCode: '+1', timezones: ['America/Toronto', 'America/Vancouver'] },
  { code: 'BR', name: 'Brazil', nameZh: '巴西', phoneCode: '+55', timezones: ['America/Sao_Paulo'] },
  { code: 'AE', name: 'United Arab Emirates', nameZh: '阿联酋', phoneCode: '+971', timezones: ['Asia/Dubai'] },
  { code: 'SA', name: 'Saudi Arabia', nameZh: '沙特阿拉伯', phoneCode: '+966', timezones: ['Asia/Riyadh'] },
  { code: 'MY', name: 'Malaysia', nameZh: '马来西亚', phoneCode: '+60', timezones: ['Asia/Kuala_Lumpur'] },
  { code: 'TH', name: 'Thailand', nameZh: '泰国', phoneCode: '+66', timezones: ['Asia/Bangkok'] },
  { code: 'VN', name: 'Vietnam', nameZh: '越南', phoneCode: '+84', timezones: ['Asia/Ho_Chi_Minh'] },
  { code: 'ID', name: 'Indonesia', nameZh: '印度尼西亚', phoneCode: '+62', timezones: ['Asia/Jakarta'] },
  { code: 'PH', name: 'Philippines', nameZh: '菲律宾', phoneCode: '+63', timezones: ['Asia/Manila'] },
  { code: 'NG', name: 'Nigeria', nameZh: '尼日利亚', phoneCode: '+234', timezones: ['Africa/Lagos'] },
  { code: 'KE', name: 'Kenya', nameZh: '肯尼亚', phoneCode: '+254', timezones: ['Africa/Nairobi'] },
  { code: 'ZA', name: 'South Africa', nameZh: '南非', phoneCode: '+27', timezones: ['Africa/Johannesburg'] },
  { code: 'MX', name: 'Mexico', nameZh: '墨西哥', phoneCode: '+52', timezones: ['America/Mexico_City'] },
  { code: 'AR', name: 'Argentina', nameZh: '阿根廷', phoneCode: '+54', timezones: ['America/Argentina/Buenos_Aires'] },
  { code: 'ES', name: 'Spain', nameZh: '西班牙', phoneCode: '+34', timezones: ['Europe/Madrid'] },
  { code: 'IT', name: 'Italy', nameZh: '意大利', phoneCode: '+39', timezones: ['Europe/Rome'] },
  { code: 'RU', name: 'Russia', nameZh: '俄罗斯', phoneCode: '+7', timezones: ['Europe/Moscow'] },
  { code: 'TR', name: 'Turkey', nameZh: '土耳其', phoneCode: '+90', timezones: ['Europe/Istanbul'] },
  { code: 'EG', name: 'Egypt', nameZh: '埃及', phoneCode: '+20', timezones: ['Africa/Cairo'] },
  { code: 'PK', name: 'Pakistan', nameZh: '巴基斯坦', phoneCode: '+92', timezones: ['Asia/Karachi'] },
  { code: 'BD', name: 'Bangladesh', nameZh: '孟加拉国', phoneCode: '+880', timezones: ['Asia/Dhaka'] },
];

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    // In production: handle file via multer, upload to S3
    // For now, return a placeholder response
    const fileId = uuidv4();
    const url = `https://storage.example.com/uploads/${fileId}`;

    res.status(201).json({
      code: 0,
      message: 'ok',
      data: { id: fileId, url },
    });
  } catch (err) {
    next(err);
  }
}

export async function translate(req: Request, res: Response, next: NextFunction) {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      throw new AppError(400, 10001, 'text and targetLang required');
    }

    // In production: call DeepL / Google Translate API
    // For now, return the original text
    res.json({
      code: 0,
      message: 'ok',
      data: {
        original: text,
        translated: text,
        targetLang,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCountries(_req: Request, res: Response) {
  res.json({ code: 0, message: 'ok', data: COUNTRIES });
}

export async function getTimezones(_req: Request, res: Response) {
  const timezones = Intl.supportedValuesOf
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC', 'Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];
  res.json({ code: 0, message: 'ok', data: timezones });
}

export async function report(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetUserId, reason, detail, evidence } = req.body;

    const report = await prisma.report.create({
      data: {
        reporterId: req.userId!,
        targetUserId,
        reason,
        detail: detail || null,
        evidence: evidence || [],
      },
    });

    res.status(201).json({ code: 0, message: 'Report submitted', data: report });
  } catch (err) {
    next(err);
  }
}
