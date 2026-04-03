import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { setupProgressGuard } from './guards/progress.guard';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

setupProgressGuard(router);

export default router;
