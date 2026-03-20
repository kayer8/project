import { announcements } from '../../../mock/community';

Page({
  data: {
    item: null as (typeof announcements)[number] | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      item: announcements.find((announcement) => announcement.id === query.id) || null,
    });
  },
});
