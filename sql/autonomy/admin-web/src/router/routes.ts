import type { RouteRecordRaw } from 'vue-router';
import DefaultLayout from '@/layouts/default/index.vue';
import BlankLayout from '@/layouts/blank/index.vue';
import voteRoutes from './modules/vote';
import announcementRoutes from './modules/announcement';
import disclosureRoutes from './modules/disclosure';
import buildingRoutes from './modules/building';
import houseRoutes from './modules/house';
import memberRoutes from './modules/member';
import ownerRoutes from './modules/owner';
import settingsRoutes from './modules/settings';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: BlankLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/auth/login.vue'),
        meta: { title: '登录' },
      },
    ],
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/votes/list',
    children: [
      ...voteRoutes,
      ...announcementRoutes,
      ...disclosureRoutes,
      ...houseRoutes,
      ...buildingRoutes,
      ...memberRoutes,
      ...ownerRoutes,
      ...settingsRoutes,
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/votes/list',
  },
];

export default routes;
