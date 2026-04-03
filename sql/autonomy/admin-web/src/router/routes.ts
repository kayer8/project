import type { RouteRecordRaw } from 'vue-router';
import DefaultLayout from '@/layouts/default/index.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: 'Home' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export default routes;
