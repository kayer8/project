import { request } from '@/api/request';

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: {
    adminId: string;
    email: string;
    roleName: string;
  };
}

export interface AdminMeResponse {
  adminId: string;
  email: string;
  roleName: string;
}

export function loginAdmin(payload: AdminLoginPayload) {
  return request<AdminLoginResponse>({
    url: '/auth/login',
    method: 'post',
    data: payload,
  });
}

export function fetchAdminMe() {
  return request<AdminMeResponse>({
    url: '/me',
    method: 'get',
  });
}
