import type { RouteRecordRaw } from 'vue-router';

const buildingRoutes: RouteRecordRaw[] = [
  {
    path: 'buildings/list',
    name: 'AutonomyBuildingList',
    component: () => import('@/views/building/list.vue'),
    meta: {
      title: '楼栋管理',
    },
  },
];

export default buildingRoutes;
