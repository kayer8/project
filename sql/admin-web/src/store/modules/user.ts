import { defineStore } from 'pinia';
import { getToken, setToken, clearToken } from '@/utils/storage';

export interface UserProfile {
  name: string;
  roles: string[];
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    profile: { name: '访客', roles: [] } as UserProfile,
  }),
  actions: {
    setProfile(profile: UserProfile) {
      this.profile = profile;
    },
    login(token: string) {
      this.token = token;
      setToken(token);
    },
    logout() {
      this.token = '';
      clearToken();
    },
  },
});
