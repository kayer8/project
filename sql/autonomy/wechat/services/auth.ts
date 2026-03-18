import { request } from './request';

export interface WechatAuthUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  mobile: string | null;
  realName: string | null;
}

export interface WechatLoginResult {
  needRegister: boolean;
  accessToken: string | null;
  user: WechatAuthUser | null;
}

export interface WechatRegisterPayload {
  code: string;
  nickname: string;
  avatarUrl?: string;
  mobile?: string;
}

export interface WechatProfile {
  nickname: string;
  avatarUrl: string;
}

export function getWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('微信登录失败，请稍后重试'));
      },
      fail: (error) => reject(new Error(error.errMsg || '微信登录失败')),
    });
  });
}

export function getWechatProfile() {
  return new Promise<WechatProfile>((resolve) => {
    wx.getUserProfile({
      desc: '用于完善头像昵称并创建账号',
      success: (res) => {
        resolve({
          nickname: res.userInfo.nickName || '微信用户',
          avatarUrl: res.userInfo.avatarUrl || '',
        });
      },
      fail: () => {
        resolve({
          nickname: '微信用户',
          avatarUrl: '',
        });
      },
    });
  });
}

export function loginWithWechat(payload: {
  code: string;
  nickname?: string;
  avatarUrl?: string;
}) {
  return request<WechatLoginResult>({
    url: '/auth/wechat_login',
    method: 'POST',
    data: payload,
    auth: false,
  });
}

export function registerWithWechat(payload: WechatRegisterPayload) {
  return request<WechatLoginResult>({
    url: '/auth/wechat/register',
    method: 'POST',
    data: payload,
    auth: false,
  });
}
