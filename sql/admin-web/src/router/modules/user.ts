import type { RouteRecordRaw } from 'vue-router';

const userRoutes: RouteRecordRaw[] = [
  {
    path: 'users/list',
    name: 'UserList',
    component: () => import('@/views/user/list.vue'),
    meta: { title: '用户', requiresAuth: true },
  },
  {
    path: 'users/detail',
    name: 'UserDetail',
    component: () => import('@/views/user/detail.vue'),
    meta: { title: '用户详情', requiresAuth: true },
  },
];

export default userRoutes;
