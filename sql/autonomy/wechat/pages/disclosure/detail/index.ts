import {
  fetchDisclosureContentDetail,
  formatDisclosureDate,
  getDisclosureDisplayDate,
  PublicDisclosureContentItem,
} from '../../../services/disclosure';

function splitDisclosureParagraphs(content: string) {
  return content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

Page({
  data: {
    loading: false,
    errorMessage: '',
    item: null as
      | (PublicDisclosureContentItem & {
          displayDate: string;
          summaryText: string;
          contentText: string;
          summaryParagraphs: string[];
          contentParagraphs: string[];
        })
      | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    if (!query.id) {
      this.setData({
        errorMessage: '缺少公开内容标识',
      });
      return;
    }

    void this.loadDetail(query.id);
  },

  async loadDetail(id: string) {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const item = await fetchDisclosureContentDetail(id);

      this.setData({
        item: {
          ...item,
          displayDate: formatDisclosureDate(getDisclosureDisplayDate(item)),
          summaryText: item.summary || '',
          contentText: item.content || '',
          summaryParagraphs: splitDisclosureParagraphs(item.summary || ''),
          contentParagraphs: splitDisclosureParagraphs(item.content || ''),
        },
      });
    } catch (error) {
      console.error('load disclosure detail failed', error);
      this.setData({
        item: null,
        errorMessage: error instanceof Error ? error.message : '公开详情加载失败',
      });
    } finally {
      this.setData({ loading: false });
    }
  },
});
