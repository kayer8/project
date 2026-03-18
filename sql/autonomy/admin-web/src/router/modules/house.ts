import type { RouteRecordRaw } from 'vue-router';

const houseRoutes: RouteRecordRaw[] = [
  {
    path: 'houses/list',
    name: 'AutonomyHouseList',
    component: () => import('@/views/house/list.vue'),
    meta: {
      title: '房屋数据',
    },
  },
  {
    path: 'houses/:id',
    name: 'AutonomyHouseDetail',
    component: () => import('@/views/house/detail.vue'),
    meta: {
      title: '房屋详情',
    },
  },
];

export default houseRoutes;
