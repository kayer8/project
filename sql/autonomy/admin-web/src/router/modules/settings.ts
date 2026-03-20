import type { RouteRecordRaw } from 'vue-router';

const settingsRoutes: RouteRecordRaw[] = [
  {
    path: 'settings',
    name: 'AutonomySettings',
    component: () => import('@/views/settings/index.vue'),
    meta: {
      title: '系统设置',
    },
  },
];

export default settingsRoutes;
