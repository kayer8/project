import type { RouteRecordRaw } from 'vue-router';
import DefaultLayout from '@/layouts/default/index.vue';
import BlankLayout from '@/layouts/blank/index.vue';
import dashboardRoutes from './modules/dashboard';
import buildingRoutes from './modules/building';
import userRoutes from './modules/user';
import houseRoutes from './modules/house';
import memberRoutes from './modules/member';

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
    redirect: '/dashboard',
    children: [...dashboardRoutes, ...userRoutes, ...buildingRoutes, ...houseRoutes, ...memberRoutes],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

export default routes;
