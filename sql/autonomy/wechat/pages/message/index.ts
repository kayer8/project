import { getMessages } from '../../services/mock';
import { openRoute } from '../../utils/nav';

Page({
  data: {
    messages: getMessages(),
  },

  onShow() {
    this.setData({
      messages: getMessages(),
    });
  },

  handleOpenMessage(event: WechatMiniprogram.BaseEvent) {
    const { id, target } = event.currentTarget.dataset as { id: string; target?: string };
    const messages = this.data.messages.map((item) => (item.id === id ? { ...item, unread: false } : item));
    this.setData({ messages });
    if (target) {
      openRoute(target);
    }
  },

  handleMarkAllRead() {
    this.setData({
      messages: this.data.messages.map((item) => ({ ...item, unread: false })),
    });
    wx.showToast({ title: '已全部标记为已读', icon: 'success' });
  },
});
