import type { RouteRecordRaw } from 'vue-router';

const userRoutes: RouteRecordRaw[] = [
  {
    path: 'users/list',
    name: 'UserList',
    component: () => import('@/views/user/list.vue'),
    meta: { title: 'Users', requiresAuth: true },
  },
  {
    path: 'users/detail',
    name: 'UserDetail',
    component: () => import('@/views/user/detail.vue'),
    meta: { title: 'User Detail', requiresAuth: true },
  },
];

export default userRoutes;