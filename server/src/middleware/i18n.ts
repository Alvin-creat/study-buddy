import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LOCALES = ['zh-CN', 'en', 'ja', 'ko', 'es', 'fr', 'ar'];
const DEFAULT_LOCALE = 'en';

export function i18nMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers['accept-language'] as string | undefined;
  let locale = DEFAULT_LOCALE;

  if (header) {
    const preferred = header.split(',')[0].trim();
    if (SUPPORTED_LOCALES.includes(preferred)) {
      locale = preferred;
    } else {
      const lang = preferred.split('-')[0];
      const match = SUPPORTED_LOCALES.find((l) => l.startsWith(lang));
      if (match) locale = match;
    }
  }

  (req as any).locale = locale;
  next();
}
