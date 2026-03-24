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

interface AnnouncementListItem extends PublicDisclosureContentItem {
  displayDate: string;
  preview: string;
}

function filterAnnouncements(items: AnnouncementListItem[], keyword: string) {
  const normalized = keyword.trim();

  if (!normalized) {
    return items;
  }

  return items.filter((item) =>
    [item.title, item.category, item.publisher, item.summary || '', item.content].some((field) =>
      field.includes(normalized),
    ),
  );
}

function mapAnnouncement(item: PublicDisclosureContentItem): AnnouncementListItem {
  return {
    ...item,
    displayDate: formatDisclosureDate(getDisclosureDisplayDate(item)),
    preview: getDisclosurePreview(item),
  };
}

Page({
  data: {
    keyword: '',
    allAnnouncements: [] as AnnouncementListItem[],
    filteredAnnouncements: [] as AnnouncementListItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    errorMessage: '',
    pageSize: 10,
  },

  onLoad() {
    void this.loadAnnouncements();
  },

  async loadAnnouncements() {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const result = await fetchDisclosureContents({
        category: '通知公告',
        page: 1,
        pageSize: 100,
      });
      const announcements = result.items.map(mapAnnouncement);

      this.setData({
        allAnnouncements: announcements,
      });
      this.applyAnnouncementList(true, announcements);
    } catch (error) {
      console.error('load disclosure announcements failed', error);
      this.setData({
        allAnnouncements: [],
        filteredAnnouncements: [],
        errorMessage: error instanceof Error ? error.message : '公开内容加载失败',
        finished: true,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleKeywordInput(event: WechatMiniprogram.Input) {
    const keyword = event.detail.value;

    this.setData({ keyword });
    this.applyAnnouncementList(true);
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.disclosure.detail, { id });
  },

  onPullDownRefresh() {
    void this.loadAnnouncements().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    this.applyAnnouncementList(true);
    event?.detail?.done?.();
  },

  onListLoadMore() {
    if (this.data.finished || this.data.isLoadMore) {
      return;
    }

    this.setData({ isLoadMore: true });
    this.applyAnnouncementList(false);
    this.setData({ isLoadMore: false });
  },

  applyAnnouncementList(reset = true, source?: AnnouncementListItem[]) {
    const listSource = source ?? this.data.allAnnouncements;
    const filtered = filterAnnouncements(listSource, this.data.keyword);
    const result = reset
      ? getLocalListFirstPage(filtered, this.data.pageSize)
      : getLocalListPage(filtered, this.data.filteredAnnouncements.length, this.data.pageSize);

    this.setData({
      filteredAnnouncements: reset
        ? result.items
        : [...this.data.filteredAnnouncements, ...result.items],
      finished: result.finished,
    });
  },
});
