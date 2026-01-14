import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: { method: string; originalUrl?: string; url?: string }, res: { statusCode: number; on: (event: string, callback: () => void) => void }, next: () => void) {
    const { method } = req;
    const url = req.originalUrl ?? req.url ?? '';
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${method} ${url} ${res.statusCode} +${duration}ms`);
    });

    next();
  }
}
