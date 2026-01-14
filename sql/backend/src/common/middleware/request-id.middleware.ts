import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants/app.constants';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: { headers: Record<string, string | string[] | undefined> }, res: { setHeader: (key: string, value: string) => void }, next: () => void) {
    const headerKey = REQUEST_ID_HEADER.toLowerCase();
    const existing = req.headers[headerKey];
    const requestId = Array.isArray(existing) ? existing[0] : existing;
    if (requestId) {
      res.setHeader(REQUEST_ID_HEADER, requestId);
    } else {
      const newId = randomUUID();
      req.headers[headerKey] = newId;
      res.setHeader(REQUEST_ID_HEADER, newId);
    }
    next();
  }
}
