import type { RouteRecordRaw } from 'vue-router';

const voteRoutes: RouteRecordRaw[] = [
  {
    path: 'votes/list',
    name: 'AutonomyVoteList',
    component: () => import('@/views/vote/list.vue'),
    meta: {
      title: '投票列表',
    },
  },
  {
    path: 'votes/results',
    name: 'AutonomyVoteResults',
    component: () => import('@/views/vote/results.vue'),
    meta: {
      title: '投票结果',
    },
  },
];

export default voteRoutes;
