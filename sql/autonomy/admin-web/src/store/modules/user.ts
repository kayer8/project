import { defineStore } from 'pinia';
import { appConfig } from '@/config/app';
import { storage } from '@/utils/storage';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: storage.get(appConfig.tokenKey) ?? '',
    name: '系统管理员',
  }),
  actions: {
    setToken(token: string) {
      this.token = token;
      storage.set(appConfig.tokenKey, token);
    },
    clearToken() {
      this.token = '';
      storage.remove(appConfig.tokenKey);
    },
    setName(name: string) {
      this.name = name;
    },
  },
});
