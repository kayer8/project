import type { RouteRecordRaw } from 'vue-router';

const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'system/role',
    name: 'Role',
    component: () => import('@/views/system/role.vue'),
    meta: { title: 'Role', requiresAuth: true },
  },
  {
    path: 'system/permission',
    name: 'Permission',
    component: () => import('@/views/system/permission.vue'),
    meta: { title: 'Permission', requiresAuth: true },
  },
  {
    path: 'system/logs',
    name: 'Logs',
    component: () => import('@/views/system/logs.vue'),
    meta: { title: 'Logs', requiresAuth: true },
  },
];

export default systemRoutes;