import { Request, Response, NextFunction } from 'express';
import * as matchService from '../services/match';

export async function recommend(req: Request, res: Response, next: NextFunction) {
  try {
    const { examId, page = '1', pageSize = '20' } = req.query;
    if (!examId || typeof examId !== 'string') {
      return res.status(400).json({ code: 10001, message: 'examId required' });
    }
    const result = await matchService.recommend(
      req.userId!,
      examId,
      parseInt(page as string, 10),
      parseInt(pageSize as string, 10)
    );
    res.json({ code: 0, message: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.search(req.userId!, req.query as any);
    res.json({ code: 0, message: 'ok', ...result });
  } catch (err) {
    next(err);
  }
}

export async function sendRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.sendRequest(req.userId!, req.body);
    res.status(201).json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function receivedRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.getRequests(req.userId!, 'received');
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function sentRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.getRequests(req.userId!, 'sent');
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function acceptRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await matchService.acceptRequest(req.userId!, req.params.id);
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    next(err);
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await matchService.rejectRequest(req.userId!, req.params.id);
    res.json({ code: 0, message: 'Request rejected' });
  } catch (err) {
    next(err);
  }
}
