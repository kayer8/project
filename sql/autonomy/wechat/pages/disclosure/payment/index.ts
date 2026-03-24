import { ROUTES } from '../../../constants/routes';
import {
  fetchDisclosureContents,
  formatDisclosureDate,
  getDisclosureDisplayDate,
  getDisclosurePreview,
  PublicDisclosureContentItem,
} from '../../../services/disclosure';
import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';
import { navigateTo } from '../../../utils/nav';

interface PaymentDisclosureItem extends PublicDisclosureContentItem {
  displayDate: string;
  preview: string;
}

function mapItem(item: PublicDisclosureContentItem): PaymentDisclosureItem {
  return {
    ...item,
    displayDate: formatDisclosureDate(getDisclosureDisplayDate(item)),
    preview: getDisclosurePreview(item),
  };
}

Page({
  data: {
    allItems: [] as PaymentDisclosureItem[],
    items: [] as PaymentDisclosureItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    errorMessage: '',
    pageSize: 10,
  },

  onLoad() {
    void this.loadContents();
  },

  async loadContents() {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const result = await fetchDisclosureContents({
        category: '收费公开',
        page: 1,
        pageSize: 100,
      });

      this.setData({
        allItems: result.items.map(mapItem),
      });
      this.applyPagedList(true);
    } catch (error) {
      console.error('load payment disclosure contents failed', error);
      this.setData({
        allItems: [],
        items: [],
        errorMessage: error instanceof Error ? error.message : '收费公开加载失败',
        finished: true,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.disclosure.detail, { id });
  },

  onPullDownRefresh() {
    void this.loadContents().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    this.applyPagedList(true);
    event?.detail?.done?.();
  },

  onListLoadMore() {
    if (this.data.finished || this.data.isLoadMore) {
      return;
    }

    this.setData({ isLoadMore: true });
    this.applyPagedList(false);
    this.setData({ isLoadMore: false });
  },

  applyPagedList(reset = true) {
    const result = reset
      ? getLocalListFirstPage(this.data.allItems, this.data.pageSize)
      : getLocalListPage(this.data.allItems, this.data.items.length, this.data.pageSize);

    this.setData({
      items: reset ? result.items : [...this.data.items, ...result.items],
      finished: result.finished,
    });
  },
});
