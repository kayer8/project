import type { AxiosRequestConfig } from 'axios';
import http from './http';

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return http.request(config) as Promise<T>;
}