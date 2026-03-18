import axios from 'axios';
import { MessagePlugin } from 'tdesign-vue-next';
import { appConfig } from '@/config/app';
import { storage } from '@/utils/storage';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000/admin/v1',
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = storage.get(appConfig.tokenKey);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? '请求失败';

    if (error?.response?.status === 401) {
      storage.remove(appConfig.tokenKey);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    MessagePlugin.error(message);
    return Promise.reject(error);
  },
);

export default http;
