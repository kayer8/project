import { Injectable } from '@nestjs/common';

export interface WechatSession {
  openid: string;
  sessionKey: string;
  unionid?: string;
}

@Injectable()
export class WechatService {
  async codeToSession(code: string): Promise<WechatSession> {
    const normalized = code.trim() || 'demo';

    return {
      openid: `mock_${normalized}`,
      sessionKey: `session_${normalized}`,
    };
  }
}
