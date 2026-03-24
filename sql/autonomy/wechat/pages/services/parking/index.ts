import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

const mockBills = [
  { title: '3 月停车月卡', note: '待缴费 · 260 元' },
  { title: '临时停车记录', note: '3 次进出 · 合计 46 元' },
];

type ParkingBill = (typeof mockBills)[number];

Page({
  data: {
    allBills: mockBills as ParkingBill[],
    bills: [] as ParkingBill[],
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

  applyPagedList(reset = true, source?: ParkingBill[]) {
    const listSource = source ?? this.data.allBills;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.bills.length, this.data.pageSize);

    this.setData({
      bills: reset ? result.items : [...this.data.bills, ...result.items],
      finished: result.finished,
    });
  },
});
