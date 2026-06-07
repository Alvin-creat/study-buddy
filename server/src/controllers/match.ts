import { Request, Response, NextFunction } from 'express';
import * as matchService from '../services/match';

export async function listMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const { examType, keyword, timezone, page, limit } = req.query;
    const result = await matchService.listMatches(req.userId!, {
      examType: examType as string | undefined,
      keyword: keyword as string | undefined,
      timezone: timezone as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    res.json({ code: 0, message: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

export async function greet(req: Request, res: Response, next: NextFunction) {
  try {
    const { message } = req.body || {};
    const result = await matchService.sendRequest(req.userId!, req.params.userId, message);
    res.status(201).json({ code: 0, message: result.matched ? 'Matched!' : 'Request sent', data: result });
  } catch (err) {
    next(err);
  }
}

export async function getRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.getRequests(req.userId!);
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    if (status === 'accepted') {
      const result = await matchService.acceptRequest(req.userId!, req.params.id);
      return res.json({ code: 0, message: 'ok', data: result });
    } else {
      await matchService.rejectRequest(req.userId!, req.params.id);
      return res.json({ code: 0, message: 'Request rejected' });
    }
  } catch (err) {
    next(err);
  }
}

export async function getConnections(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.getConnections(req.userId!);
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}
