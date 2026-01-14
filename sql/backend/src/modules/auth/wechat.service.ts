import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { BusinessException } from '../../common/exceptions/business.exception';

export interface WechatSession {
  openId: string;
  unionId?: string;
  sessionKey: string;
}

@Injectable()
export class WechatService {
  constructor(private readonly configService: ConfigService) {}

  async codeToSession(code: string): Promise<WechatSession> {
    const appId = this.configService.get<string>('wechat.appId');
    const secret = this.configService.get<string>('wechat.secret');
    const baseUrl = this.configService.get<string>('wechat.baseUrl');
    const grantType = this.configService.get<string>('wechat.grantType');

    if (!appId || !secret) {
      throw new BusinessException(
        AppErrorCode.WECHAT_AUTH_FAILED,
        'WeChat credentials are not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = new URL('/sns/jscode2session', baseUrl);
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', secret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', grantType ?? 'authorization_code');

    const response = await fetch(url.toString());
    const data = (await response.json()) as {
      openid?: string;
      unionid?: string;
      session_key?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || data.errcode) {
      throw new BusinessException(
        AppErrorCode.WECHAT_AUTH_FAILED,
        data.errmsg ?? 'WeChat auth failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!data.openid || !data.session_key) {
      throw new BusinessException(
        AppErrorCode.WECHAT_AUTH_FAILED,
        'WeChat response missing openid or session_key',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      openId: data.openid,
      unionId: data.unionid,
      sessionKey: data.session_key,
    };
  }
}
