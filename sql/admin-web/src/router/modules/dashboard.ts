import type { RouteRecordRaw } from 'vue-router';

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '看板', requiresAuth: true },
  },
];

export default dashboardRoutes;
