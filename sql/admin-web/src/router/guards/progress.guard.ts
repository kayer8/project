import type { Router } from 'vue-router';
import { APP_TITLE } from '@/config/app';

export function setupProgressGuard(router: Router) {
  router.beforeEach((to, _from, next) => {
    const title = typeof to.meta?.title === 'string' ? to.meta.title : APP_TITLE;
    document.title = `${title} - ${APP_TITLE}`;
    next();
  });
}