import { ROUTES } from '../../../constants/routes';
import { getAnnouncements } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    keyword: '',
    records: getAnnouncements(),
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    const keyword = this.data.keyword.trim();
    const records = keyword
      ? getAnnouncements().filter((item) => item.title.includes(keyword))
      : getAnnouncements();
    this.setData({ records });
  },

  handleKeywordInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ keyword: event.detail.value }, () => this.loadRecords());
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.announcementDetail, { id });
  },
});
