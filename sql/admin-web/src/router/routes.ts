import type { RouteRecordRaw } from 'vue-router';
import DefaultLayout from '@/layouts/default/index.vue';
import BlankLayout from '@/layouts/blank/index.vue';
import dashboardRoutes from './modules/dashboard';
import contentRoutes from './modules/content';
import userRoutes from './modules/user';
import systemRoutes from './modules/system';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: BlankLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/auth/login.vue'),
        meta: { title: 'Login' },
      },
    ],
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [...dashboardRoutes, ...contentRoutes, ...userRoutes, ...systemRoutes],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

export default routes;