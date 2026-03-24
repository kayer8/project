import { aiSuggestions } from '../../mock/community';
import { getLocalListFirstPage, getLocalListPage } from '../../utils/list';

Page({
  data: {
    allSuggestions: aiSuggestions,
    suggestions: [] as string[],
    loading: false,
    isLoadMore: false,
    finished: false,
    pageSize: 6,
  },

  onLoad() {
    this.applySuggestions(true);
  },

  onListRefresh(event: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    this.applySuggestions(true);
    event.detail?.done?.();
  },

  onListLoadMore() {
    if (this.data.finished || this.data.isLoadMore) {
      return;
    }

    this.setData({ isLoadMore: true });
    this.applySuggestions(false);
    this.setData({ isLoadMore: false });
  },

  applySuggestions(reset = true, source?: string[]) {
    const listSource = source ?? this.data.allSuggestions;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.suggestions.length, this.data.pageSize);

    this.setData({
      suggestions: reset ? result.items : [...this.data.suggestions, ...result.items],
      finished: result.finished,
    });
  },
});
