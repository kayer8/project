import type { RouteRecordRaw } from 'vue-router';

const announcementRoutes: RouteRecordRaw[] = [
  {
    path: 'announcements/list',
    name: 'AutonomyAnnouncementList',
    redirect: '/disclosures/content?category=通知公告',
    meta: {
      title: '公告列表',
    },
  },
  {
    path: 'announcements/categories',
    name: 'AutonomyAnnouncementCategories',
    redirect: '/disclosures/content?category=通知公告',
    meta: {
      title: '分类管理',
    },
  },
];

export default announcementRoutes;
