import { getAnnouncementDetail } from '../../../services/mock';

Page({
  data: {
    record: null as ReturnType<typeof getAnnouncementDetail> | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      record: getAnnouncementDetail(query.id || ''),
    });
  },

  handleShare() {
    wx.showToast({ title: '已模拟生成公告分享卡片', icon: 'none' });
  },
});
