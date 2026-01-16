import type { RouteRecordRaw } from 'vue-router';

const systemRoutes: RouteRecordRaw[] = [
  {
    path: 'system/role',
    name: 'Role',
    component: () => import('@/views/system/role.vue'),
    meta: { title: '角色管理', requiresAuth: true },
  },
  {
    path: 'system/permission',
    name: 'Permission',
    component: () => import('@/views/system/permission.vue'),
    meta: { title: '权限管理', requiresAuth: true },
  },
  {
    path: 'system/logs',
    name: 'Logs',
    component: () => import('@/views/system/logs.vue'),
    meta: { title: '系统日志', requiresAuth: true },
  },
];

export default systemRoutes;
