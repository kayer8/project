import type { RouteRecordRaw } from 'vue-router';

const userRoutes: RouteRecordRaw[] = [
  {
    path: 'users/list',
    name: 'AutonomyUserList',
    component: () => import('@/views/user/list.vue'),
    meta: {
      title: '用户数据',
    },
  },
  {
    path: 'users/:id',
    name: 'AutonomyUserDetail',
    component: () => import('@/views/user/detail.vue'),
    meta: {
      title: '用户详情',
    },
  },
];

export default userRoutes;
