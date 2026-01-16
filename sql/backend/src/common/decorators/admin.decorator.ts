import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Admin = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const admin = request.user as Record<string, unknown> | undefined;
    if (!data) {
      return admin;
    }
    return admin?.[data];
  },
);
