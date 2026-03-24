import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

const mockItems = [
  { title: '代办申请', note: '为老人、家属或代理人发起协助办理申请' },
  { title: '待办记录', note: '查看当前代办任务与处理进度' },
  { title: '授权范围', note: '明确可代办的事项边界和有效期' },
];

type AgencyItem = (typeof mockItems)[number];

Page({
  data: {
    allItems: mockItems as AgencyItem[],
    items: [] as AgencyItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    pageSize: 10,
  },

  onLoad() {
    this.applyPagedList(true);
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

  applyPagedList(reset = true, source?: AgencyItem[]) {
    const listSource = source ?? this.data.allItems;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.items.length, this.data.pageSize);

    this.setData({
      items: reset ? result.items : [...this.data.items, ...result.items],
      finished: result.finished,
    });
  },
});
