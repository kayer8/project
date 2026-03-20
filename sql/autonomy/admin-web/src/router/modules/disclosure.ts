import type { RouteRecordRaw } from 'vue-router';

const disclosureRoutes: RouteRecordRaw[] = [
  {
    path: 'disclosures/content',
    name: 'AutonomyDisclosureContent',
    component: () => import('@/views/disclosure/content.vue'),
    meta: {
      title: '内容管理',
    },
  },
  {
    path: 'disclosures/publish-records',
    name: 'AutonomyDisclosurePublishRecords',
    component: () => import('@/views/disclosure/publish.vue'),
    meta: {
      title: '发布记录',
    },
  },
];

export default disclosureRoutes;
