import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth';

export async function sendCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.sendVerificationCode(req.body);
    res.json({ code: 0, message: 'Verification code sent', data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ code: 10001, message: 'refreshToken required' });
    }
    const result = await authService.refreshTokens(refreshToken);
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ code: 0, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
