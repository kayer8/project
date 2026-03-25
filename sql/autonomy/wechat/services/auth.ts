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

export interface PhoneSyncResult {
  matched: boolean;
  needRegistrationRequest: boolean;
  message: string;
  accessToken: string;
  user: WechatAuthUser;
  mobile?: string;
}

export interface RegisterBuildingOption {
  id: string;
  buildingName: string;
  buildingCode: string;
  sortNo: number | null;
  status: string;
}

export interface RegisterHouseOption {
  id: string;
  buildingId: string;
  displayName: string;
  floorNo: number | null;
  roomNo: string;
  houseStatus: string;
}

export interface SubmitRegistrationRequestPayload {
  buildingId: string;
  houseId?: string;
}

export interface SubmitRegistrationRequestResult {
  submitted: boolean;
  residentStatus: string;
  latestRegistrationRequest: {
    id: string;
    mobile: string;
    status: string;
    buildingId: string;
    buildingName: string | null;
    houseId: string | null;
    houseDisplayName: string | null;
    reviewNote: string | null;
    submittedAt: string;
  };
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

export function loginWithWechat(payload: { code: string }) {
  return request<WechatLoginResult>({
    url: '/auth/wechat_login',
    method: 'POST',
    data: payload,
    auth: false,
  });
}

export function syncWechatPhone(payload: { code: string; phoneCode: string }) {
  return request<PhoneSyncResult>({
    url: '/auth/wechat/phone-sync',
    method: 'POST',
    data: payload,
    auth: false,
  });
}

export function manualBindWechatPhone(payload: { code: string; mobile: string }) {
  return request<PhoneSyncResult>({
    url: '/auth/wechat/manual-bind',
    method: 'POST',
    data: payload,
    auth: false,
  });
}

export function listRegisterBuildings() {
  return request<RegisterBuildingOption[]>({
    url: '/auth/register/buildings',
    method: 'GET',
    auth: false,
  });
}

export function listRegisterHouses(buildingId: string) {
  return request<RegisterHouseOption[]>({
    url: `/auth/register/houses?buildingId=${encodeURIComponent(buildingId)}`,
    method: 'GET',
    auth: false,
  });
}

export function submitRegistrationRequest(payload: SubmitRegistrationRequestPayload) {
  return request<SubmitRegistrationRequestResult>({
    url: '/auth/wechat/registration-request',
    method: 'POST',
    data: payload,
  });
}
