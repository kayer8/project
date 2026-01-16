import type { RouteRecordRaw } from 'vue-router';

const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'task-templates',
    name: 'TaskTemplates',
    component: () => import('@/views/task-templates/list.vue'),
    meta: { title: 'Task Templates', requiresAuth: true },
  },
  {
    path: 'task-templates/new',
    name: 'TaskTemplateNew',
    component: () => import('@/views/task-templates/edit.vue'),
    meta: { title: 'New Task Template', requiresAuth: true },
  },
  {
    path: 'task-templates/:id/edit',
    name: 'TaskTemplateEdit',
    component: () => import('@/views/task-templates/edit.vue'),
    meta: { title: 'Edit Task Template', requiresAuth: true },
  },
  {
    path: 'task-templates/:id',
    name: 'TaskTemplateDetail',
    component: () => import('@/views/task-templates/detail.vue'),
    meta: { title: 'Task Template Detail', requiresAuth: true },
  },
  {
    path: 'night-programs',
    name: 'NightPrograms',
    component: () => import('@/views/night-programs/list.vue'),
    meta: { title: 'Night Programs', requiresAuth: true },
  },
  {
    path: 'night-programs/new',
    name: 'NightProgramNew',
    component: () => import('@/views/night-programs/edit.vue'),
    meta: { title: 'New Night Program', requiresAuth: true },
  },
  {
    path: 'night-programs/:id/edit',
    name: 'NightProgramEdit',
    component: () => import('@/views/night-programs/edit.vue'),
    meta: { title: 'Edit Night Program', requiresAuth: true },
  },
  {
    path: 'night-programs/:id',
    name: 'NightProgramDetail',
    component: () => import('@/views/night-programs/detail.vue'),
    meta: { title: 'Night Program Detail', requiresAuth: true },
  },
  {
    path: 'copy-templates',
    name: 'CopyTemplates',
    component: () => import('@/views/copy-templates/list.vue'),
    meta: { title: 'Copy Templates', requiresAuth: true },
  },
  {
    path: 'copy-templates/new',
    name: 'CopyTemplateNew',
    component: () => import('@/views/copy-templates/detail.vue'),
    meta: { title: 'New Copy Template', requiresAuth: true },
  },
  {
    path: 'copy-templates/:id',
    name: 'CopyTemplateDetail',
    component: () => import('@/views/copy-templates/detail.vue'),
    meta: { title: 'Copy Template Detail', requiresAuth: true },
  },
  {
    path: 'tickets',
    name: 'Tickets',
    component: () => import('@/views/tickets/list.vue'),
    meta: { title: 'Tickets', requiresAuth: true },
  },
  {
    path: 'tickets/:id',
    name: 'TicketDetail',
    component: () => import('@/views/tickets/detail.vue'),
    meta: { title: 'Ticket Detail', requiresAuth: true },
  },
  {
    path: 'configs',
    name: 'AppConfigs',
    component: () => import('@/views/configs/index.vue'),
    meta: { title: 'App Config', requiresAuth: true },
  },
  {
    path: 'analytics/task-funnel',
    name: 'AnalyticsTaskFunnel',
    component: () => import('@/views/analytics/task-funnel.vue'),
    meta: { title: 'Task Funnel', requiresAuth: true },
  },
  {
    path: 'analytics/night-funnel',
    name: 'AnalyticsNightFunnel',
    component: () => import('@/views/analytics/night-funnel.vue'),
    meta: { title: 'Night Funnel', requiresAuth: true },
  },
  {
    path: 'analytics/task-ranking',
    name: 'AnalyticsTaskRanking',
    component: () => import('@/views/analytics/task-ranking.vue'),
    meta: { title: 'Task Ranking', requiresAuth: true },
  },
];

export default adminRoutes;
