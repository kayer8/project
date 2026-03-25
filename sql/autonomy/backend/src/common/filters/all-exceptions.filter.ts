import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { AppErrorCode } from '../exceptions/app-error-code';
import { BusinessException } from '../exceptions/business.exception';

export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = AppErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = AppErrorCode.HTTP_EXCEPTION;
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const responseMessage = (response as { message?: string | string[] })
          .message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join('; ');
        } else if (responseMessage) {
          message = responseMessage;
        }
      }
    }

    const stack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);
    this.logger.error(
      `${request?.method ?? 'UNKNOWN'} ${request?.url ?? ''} -> ${status} ${code}: ${message}`,
      stack,
    );

    httpAdapter.reply(
      ctx.getResponse(),
      {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request?.url,
      },
      status,
    );
  }
}
