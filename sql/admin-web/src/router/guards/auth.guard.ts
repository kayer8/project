import type { Router } from 'vue-router';

const TOKEN_KEY = 'access_token';

export function setupAuthGuard(router: Router) {
  router.beforeEach((to, _from, next) => {
    const requiresAuth = Boolean(to.meta?.requiresAuth);
    if (!requiresAuth) {
      next();
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    next();
  });
}