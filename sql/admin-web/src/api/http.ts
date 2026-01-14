import axios from 'axios';
import { normalizeError } from './error';
import type { ApiResponse } from '@/types/api';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown> | unknown;
    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      'data' in payload
    ) {
      const typed = payload as ApiResponse<unknown>;
      if (typed.code !== 0) {
        return Promise.reject(new Error(typed.message || 'Request failed'));
      }
      return typed.data;
    }
    return payload;
  },
  (error) => Promise.reject(normalizeError(error)),
);

export default http;