import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode } from './app-error-code';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}
