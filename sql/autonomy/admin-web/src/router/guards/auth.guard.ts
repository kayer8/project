import type { Router } from 'vue-router';
import { appConfig } from '@/config/app';
import { storage } from '@/utils/storage';

export function setupAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const token = storage.get(appConfig.tokenKey);

    if (to.path === '/login') {
      if (token) {
        return '/dashboard';
      }
      return true;
    }

    if (!token) {
      return '/login';
    }

    return true;
  });
}
