import { ROUTES } from '../../../constants/routes';
import { announcements } from '../../../mock/community';
import { navigateTo } from '../../../utils/nav';

Page({
  data: {
    updates: announcements.filter((item) => item.category === '管理动态'),
  },

  openMaintenance() {
    navigateTo(ROUTES.disclosure.maintenance);
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.disclosure.detail, { id });
  },
});
