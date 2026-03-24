import { maintenanceRecords } from '../../../mock/community';
import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

Page({
  data: {
    allRecords: maintenanceRecords,
    records: [] as typeof maintenanceRecords,
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

  applyPagedList(reset = true) {
    const result = reset
      ? getLocalListFirstPage(this.data.allRecords, this.data.pageSize)
      : getLocalListPage(this.data.allRecords, this.data.records.length, this.data.pageSize);

    this.setData({
      records: reset ? result.items : [...this.data.records, ...result.items],
      finished: result.finished,
    });
  },
});
