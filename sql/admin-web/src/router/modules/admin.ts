import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'task-templates',
    name: 'TaskTemplates',
    component: () => import('@/views/task-templates/list.vue'),
    meta: { title: '任务模板', requiresAuth: true },
  },
  {
    path: 'task-templates/new',
    name: 'TaskTemplateNew',
    component: () => import('@/views/task-templates/edit.vue'),
    meta: { title: '新建任务模板', requiresAuth: true },
  },
  {
    path: 'task-templates/:id/edit',
    name: 'TaskTemplateEdit',
    component: () => import('@/views/task-templates/edit.vue'),
    meta: { title: '编辑任务模板', requiresAuth: true },
  },
  {
    path: 'task-templates/:id',
    name: 'TaskTemplateDetail',
    component: () => import('@/views/task-templates/detail.vue'),
    meta: { title: '任务模板详情', requiresAuth: true },
  },
  {
    path: 'night-programs',
    name: 'NightPrograms',
    component: () => import('@/views/night-programs/list.vue'),
    meta: { title: '夜间引导', requiresAuth: true },
  },
  {
    path: 'night-programs/new',
    name: 'NightProgramNew',
    component: () => import('@/views/night-programs/edit.vue'),
    meta: { title: '新建夜间引导', requiresAuth: true },
  },
  {
    path: 'night-programs/:id/edit',
    name: 'NightProgramEdit',
    component: () => import('@/views/night-programs/edit.vue'),
    meta: { title: '编辑夜间引导', requiresAuth: true },
  },
  {
    path: 'night-programs/:id',
    name: 'NightProgramDetail',
    component: () => import('@/views/night-programs/detail.vue'),
    meta: { title: '夜间引导详情', requiresAuth: true },
  },
  {
    path: 'copy-templates',
    name: 'CopyTemplates',
    component: () => import('@/views/copy-templates/list.vue'),
    meta: { title: '文案模板', requiresAuth: true },
  },
  {
    path: 'copy-templates/new',
    name: 'CopyTemplateNew',
    component: () => import('@/views/copy-templates/detail.vue'),
    meta: { title: '新建文案模板', requiresAuth: true },
  },
  {
    path: 'copy-templates/:id',
    name: 'CopyTemplateDetail',
    component: () => import('@/views/copy-templates/detail.vue'),
    meta: { title: '文案模板详情', requiresAuth: true },
  },
  {
    path: 'tickets',
    name: 'Tickets',
    component: () => import('@/views/tickets/list.vue'),
    meta: { title: '反馈工单', requiresAuth: true },
  },
  {
    path: 'tickets/:id',
    name: 'TicketDetail',
    component: () => import('@/views/tickets/detail.vue'),
    meta: { title: '工单详情', requiresAuth: true },
  },
  {
    path: 'configs',
    name: 'AppConfigs',
    component: () => import('@/views/configs/index.vue'),
    meta: { title: '规则配置', requiresAuth: true },
  },
  {
    path: 'analytics/task-funnel',
    name: 'AnalyticsTaskFunnel',
    component: () => import('@/views/analytics/task-funnel.vue'),
    meta: { title: '任务漏斗', requiresAuth: true },
  },
  {
    path: 'analytics/night-funnel',
    name: 'AnalyticsNightFunnel',
    component: () => import('@/views/analytics/night-funnel.vue'),
    meta: { title: '夜间漏斗', requiresAuth: true },
  },
  {
    path: 'analytics/task-ranking',
    name: 'AnalyticsTaskRanking',
    component: () => import('@/views/analytics/task-ranking.vue'),
    meta: { title: '模板表现排行', requiresAuth: true },
  },
];

export default adminRoutes;
