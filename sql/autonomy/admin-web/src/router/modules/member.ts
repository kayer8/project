import type { RouteRecordRaw } from 'vue-router';

const memberRoutes: RouteRecordRaw[] = [
  {
    path: 'members/list',
    name: 'AutonomyMemberList',
    component: () => import('@/views/member/list.vue'),
    meta: {
      title: '成员关系',
    },
  },
  {
    path: 'members/:id',
    name: 'AutonomyMemberDetail',
    component: () => import('@/views/member/detail.vue'),
    meta: {
      title: '成员详情',
    },
  },
];

export default memberRoutes;
