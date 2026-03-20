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
  {
    path: 'disclosures/management-fees',
    name: 'AutonomyDisclosureManagementFees',
    component: () => import('@/views/disclosure/management-fee.vue'),
    meta: {
      title: '管理费公开',
    },
  },
  {
    path: 'disclosures/management-fees/:periodKey',
    name: 'AutonomyDisclosureManagementFeeLedger',
    component: () => import('@/views/disclosure/management-fee-ledger.vue'),
    meta: {
      title: '管理费缴费账目',
    },
  },
];

export default disclosureRoutes;
