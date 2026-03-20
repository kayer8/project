import { ROUTES } from '../../constants/routes';
import { announcements, disclosureSections } from '../../mock/community';
import { navigateTo } from '../../utils/nav';

Page({
  data: {
    sections: disclosureSections,
    latestAnnouncements: announcements.slice(0, 3),
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.disclosure.detail, { id });
  },
});
