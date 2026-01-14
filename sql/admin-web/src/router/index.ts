import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { setupAuthGuard } from './guards/auth.guard';
import { setupProgressGuard } from './guards/progress.guard';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

setupAuthGuard(router);
setupProgressGuard(router);

export default router;