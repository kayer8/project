import { contacts as mockContacts } from '../../../mock/community';
import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

type ContactItem = (typeof mockContacts)[number];

Page({
  data: {
    allContacts: mockContacts as ContactItem[],
    contacts: [] as ContactItem[],
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

  applyPagedList(reset = true, source?: ContactItem[]) {
    const listSource = source ?? this.data.allContacts;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.contacts.length, this.data.pageSize);

    this.setData({
      contacts: reset ? result.items : [...this.data.contacts, ...result.items],
      finished: result.finished,
    });
  },
});
