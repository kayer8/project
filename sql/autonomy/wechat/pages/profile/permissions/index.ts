import { permissionItems } from '../../../mock/community';
import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

type PermissionItem = (typeof permissionItems)[number];

Page({
  data: {
    allItems: permissionItems.map((item) => ({ ...item })) as PermissionItem[],
    items: [] as PermissionItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    pageSize: 10,
  },

  onLoad() {
    this.applyPagedList(true);
  },

  handleSwitchChange(event: WechatMiniprogram.CustomEvent<{ value?: boolean }>) {
    const { key } = event.currentTarget.dataset as { key?: string };

    if (!key) {
      return;
    }

    const nextItems = this.data.allItems.map((item) =>
      item.key === key
        ? {
            ...item,
            value: !!event.detail?.value,
          }
        : item,
    );

    this.setData({ allItems: nextItems });
    this.applyPagedList(true, nextItems);
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

  applyPagedList(reset = true, source?: PermissionItem[]) {
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
