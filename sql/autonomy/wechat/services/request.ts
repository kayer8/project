import { appStore } from '../store/app';
import { apiBaseUrl } from '../utils/env';

interface ApiEnvelope<T> {
  code: number | string;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}

interface RequestOptions extends WechatMiniprogram.RequestOption {
  auth?: boolean;
}

function buildUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }
  return `${apiBaseUrl}${url}`;
}

export function request<T>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = appStore.getAccessToken();
    const headers: Record<string, unknown> = {
      'content-type': 'application/json',
      ...(options.header || {}),
    };

    if (options.auth !== false && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    wx.request({
      ...options,
      url: buildUrl(options.url),
      header: headers,
      success: (res) => {
        const payload = res.data as ApiEnvelope<T> | T;

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (
            payload &&
            typeof payload === 'object' &&
            'code' in payload &&
            'data' in payload
          ) {
            const wrapped = payload as ApiEnvelope<T>;

            if (wrapped.code === 0) {
              resolve(wrapped.data);
              return;
            }

            if (wrapped.code === 'UNAUTHORIZED' || wrapped.code === 'INVALID_TOKEN') {
              appStore.clearSession();
            }

            reject(new Error(wrapped.message || '请求失败'));
            return;
          }

          resolve(payload as T);
          return;
        }

        if (
          payload &&
          typeof payload === 'object' &&
          'message' in payload &&
          typeof payload.message === 'string'
        ) {
          reject(new Error(payload.message));
          return;
        }

        reject(new Error(`请求失败(${res.statusCode})`));
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络请求失败'));
      },
    });
  });
}
