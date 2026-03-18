import type { Router } from 'vue-router';

export function setupProgressGuard(router: Router) {
  router.beforeEach((to) => {
    document.title = `${to.meta.title ?? 'Autonomy Admin'} | 物业自治管理端`;
  });
}
