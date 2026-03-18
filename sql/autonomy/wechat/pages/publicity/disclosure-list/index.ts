import { ROUTES } from '../../../constants/routes';
import { getDisclosures } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

type DisclosureCategory = 'ALL' | '问题整改' | '志愿者动态' | '财务公开';

const categories: DisclosureCategory[] = ['ALL', '问题整改', '志愿者动态', '财务公开'];

Page({
  data: {
    categories,
    activeCategory: 'ALL' as DisclosureCategory,
    records: getDisclosures(),
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    this.setData({
      records: getDisclosures(this.data.activeCategory),
    });
  },

  handleCategoryChange(event: WechatMiniprogram.BaseEvent) {
    const { category } = event.currentTarget.dataset as { category: DisclosureCategory };
    this.setData({ activeCategory: category }, () => this.loadRecords());
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.disclosureDetail, { id });
  },
});
