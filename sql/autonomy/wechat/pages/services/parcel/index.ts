import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

const mockParcels = [
  { title: '顺丰快件 SF1024', note: '已入库 · 物业前台' },
  { title: '京东快件 JD2048', note: '待领取 · 快递柜 3 号箱' },
];

type ParcelItem = (typeof mockParcels)[number];

Page({
  data: {
    allParcels: mockParcels as ParcelItem[],
    parcels: [] as ParcelItem[],
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

  applyPagedList(reset = true, source?: ParcelItem[]) {
    const listSource = source ?? this.data.allParcels;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.parcels.length, this.data.pageSize);

    this.setData({
      parcels: reset ? result.items : [...this.data.parcels, ...result.items],
      finished: result.finished,
    });
  },
});
