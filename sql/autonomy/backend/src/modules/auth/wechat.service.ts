import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

export interface WechatSession {
  openid: string;
  sessionKey: string;
  unionid?: string;
}

export interface WechatPhoneInfo {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode?: string;
}

@Injectable()
export class WechatService {
  private accessTokenCache:
    | {
        value: string;
        expiresAt: number;
      }
    | undefined;

  constructor(private readonly configService: ConfigService) {}

  async codeToSession(code: string): Promise<WechatSession> {
    const normalized = code.trim() || 'demo';

    if (this.isMockMode()) {
      return {
        openid: `mock_${normalized}`,
        sessionKey: `session_${normalized}`,
      };
    }

    const appid = this.configService.get<string>('wechat.appId');
    const secret = this.configService.get<string>('wechat.secret');
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');

    url.searchParams.set('appid', appid || '');
    url.searchParams.set('secret', secret || '');
    url.searchParams.set('js_code', normalized);
    url.searchParams.set('grant_type', 'authorization_code');

    const response = await fetch(url);
    const payload = (await response.json()) as {
      openid?: string;
      session_key?: string;
      unionid?: string;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || payload.errcode || !payload.openid || !payload.session_key) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        payload.errmsg || 'Failed to get WeChat session',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      openid: payload.openid,
      sessionKey: payload.session_key,
      unionid: payload.unionid,
    };
  }

  async getPhoneNumber(phoneCode: string): Promise<WechatPhoneInfo> {
    const normalized = phoneCode.trim();

    if (!normalized) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Phone code is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (this.isMockMode()) {
      const mobile = this.buildMockMobile(normalized);
      return {
        phoneNumber: mobile,
        purePhoneNumber: mobile,
        countryCode: '86',
      };
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          code: normalized,
        }),
      },
    );
    const payload = (await response.json()) as {
      errcode?: number;
      errmsg?: string;
      phone_info?: {
        phoneNumber?: string;
        purePhoneNumber?: string;
        countryCode?: string;
      };
    };

    if (
      !response.ok ||
      payload.errcode ||
      !payload.phone_info?.phoneNumber ||
      !payload.phone_info.purePhoneNumber
    ) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        payload.errmsg || 'Failed to get WeChat phone number',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      phoneNumber: payload.phone_info.phoneNumber,
      purePhoneNumber: payload.phone_info.purePhoneNumber,
      countryCode: payload.phone_info.countryCode,
    };
  }

  private isMockMode() {
    const appid = this.configService.get<string>('wechat.appId');
    const secret = this.configService.get<string>('wechat.secret');

    return !appid || !secret || appid === 'demo-appid' || secret === 'demo-secret';
  }

  private buildMockMobile(phoneCode: string) {
    const explicit = phoneCode.replace(/\D/g, '');

    if (explicit.length >= 11) {
      return explicit.slice(0, 11);
    }

    const seed = Array.from(phoneCode).reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return `138${String(seed).padStart(8, '0').slice(-8)}`;
  }

  private async getAccessToken() {
    if (this.accessTokenCache && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.value;
    }

    const appid = this.configService.get<string>('wechat.appId');
    const secret = this.configService.get<string>('wechat.secret');
    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');

    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appid || '');
    url.searchParams.set('secret', secret || '');

    const response = await fetch(url);
    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      errcode?: number;
      errmsg?: string;
    };

    if (!response.ok || payload.errcode || !payload.access_token || !payload.expires_in) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        payload.errmsg || 'Failed to get WeChat access token',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.accessTokenCache = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max(payload.expires_in - 60, 60) * 1000,
    };

    return payload.access_token;
  }
}
