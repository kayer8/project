import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

const mockVisits = [
  { title: '新增访客预约', note: '登记来访人信息并生成二维码' },
  { title: '历史通行记录', note: '查看已预约访客与核验记录' },
];

type VisitorItem = (typeof mockVisits)[number];

Page({
  data: {
    allVisits: mockVisits as VisitorItem[],
    visits: [] as VisitorItem[],
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

  applyPagedList(reset = true, source?: VisitorItem[]) {
    const listSource = source ?? this.data.allVisits;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.visits.length, this.data.pageSize);

    this.setData({
      visits: reset ? result.items : [...this.data.visits, ...result.items],
      finished: result.finished,
    });
  },
});
