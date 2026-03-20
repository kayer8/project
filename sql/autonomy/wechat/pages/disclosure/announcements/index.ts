import { ROUTES } from '../../../constants/routes';
import { announcements } from '../../../mock/community';
import { navigateTo } from '../../../utils/nav';

function filterAnnouncements(keyword: string) {
  const normalized = keyword.trim();

  if (!normalized) {
    return announcements;
  }

  return announcements.filter(
    (item) => item.title.includes(normalized) || item.category.includes(normalized) || item.content.includes(normalized),
  );
}

Page({
  data: {
    keyword: '',
    announcements,
    filteredAnnouncements: announcements,
  },

  handleKeywordInput(event: WechatMiniprogram.Input) {
    const keyword = event.detail.value;

    this.setData({
      keyword,
      filteredAnnouncements: filterAnnouncements(keyword),
    });
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.disclosure.detail, { id });
  },
});
