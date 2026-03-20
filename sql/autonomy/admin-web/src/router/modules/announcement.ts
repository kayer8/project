import type { RouteRecordRaw } from 'vue-router';

const announcementRoutes: RouteRecordRaw[] = [
  {
    path: 'announcements/list',
    name: 'AutonomyAnnouncementList',
    component: () => import('@/views/announcement/list.vue'),
    meta: {
      title: '公告列表',
    },
  },
  {
    path: 'announcements/categories',
    name: 'AutonomyAnnouncementCategories',
    component: () => import('@/views/announcement/category.vue'),
    meta: {
      title: '分类管理',
    },
  },
];

export default announcementRoutes;
