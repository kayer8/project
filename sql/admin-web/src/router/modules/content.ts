import type { RouteRecordRaw } from 'vue-router';

const contentRoutes: RouteRecordRaw[] = [
  {
    path: 'content/list',
    name: 'ContentList',
    component: () => import('@/views/content/list.vue'),
    meta: { title: 'Content List', requiresAuth: true },
  },
  {
    path: 'content/edit',
    name: 'ContentEdit',
    component: () => import('@/views/content/edit.vue'),
    meta: { title: 'Content Edit', requiresAuth: true },
  },
  {
    path: 'content/detail',
    name: 'ContentDetail',
    component: () => import('@/views/content/detail.vue'),
    meta: { title: 'Content Detail', requiresAuth: true },
  },
];

export default contentRoutes;