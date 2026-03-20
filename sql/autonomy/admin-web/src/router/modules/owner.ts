import type { RouteRecordRaw } from 'vue-router';

const ownerRoutes: RouteRecordRaw[] = [
  {
    path: 'owners/reviews',
    name: 'AutonomyOwnerReviews',
    component: () => import('@/views/owner/review.vue'),
    meta: {
      title: '认证审核',
    },
  },
  {
    path: 'owners/list',
    name: 'AutonomyOwnerList',
    component: () => import('@/views/owner/list.vue'),
    meta: {
      title: '业主列表',
    },
  },
];

export default ownerRoutes;
