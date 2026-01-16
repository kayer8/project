import type { RouteRecordRaw } from 'vue-router';

const contentRoutes: RouteRecordRaw[] = [
  {
    path: 'content/list',
    name: 'ContentList',
    component: () => import('@/views/content/list.vue'),
    meta: { title: '内容列表', requiresAuth: true },
  },
  {
    path: 'content/edit',
    name: 'ContentEdit',
    component: () => import('@/views/content/edit.vue'),
    meta: { title: '内容编辑', requiresAuth: true },
  },
  {
    path: 'content/detail',
    name: 'ContentDetail',
    component: () => import('@/views/content/detail.vue'),
    meta: { title: '内容详情', requiresAuth: true },
  },
];

export default contentRoutes;
