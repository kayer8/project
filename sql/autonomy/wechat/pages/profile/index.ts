import { ROUTES } from '../../constants/routes';
import {
  ensureAuthenticated,
  hydrateSessionDashboard,
  type SessionCurrentHouseView,
  type SessionProfileView,
} from '../../services/session';
import { appStore } from '../../store/app';
import { openRoute } from '../../utils/nav';

Page({
  data: {
    profile: {
      nickname: '',
      avatar: '',
      communityName: '',
      currentIdentityLabel: '',
      authStatusLabel: '',
      unreadCount: 0,
    } as SessionProfileView,
    currentHouse: null as SessionCurrentHouseView | null,
    shortcuts: [
      { title: '我的认证', path: ROUTES.auth.result, type: 'OWNER' },
      { title: '我的房屋', path: ROUTES.house.list },
      { title: '我的投票', path: ROUTES.vote.list },
      { title: '消息通知', path: ROUTES.message.index },
      { title: '公开中心', path: ROUTES.publicity.index },
    ],
  },

  async onShow() {
    if (!ensureAuthenticated()) {
      return;
    }

    try {
      const session = await hydrateSessionDashboard();
      this.setData({
        profile: session.profile,
        currentHouse: session.currentHouse,
      });
    } catch (error) {
      if (!appStore.hasAccessToken()) {
        ensureAuthenticated();
        return;
      }

      wx.showToast({
        title: error instanceof Error ? error.message : '加载个人信息失败',
        icon: 'none',
      });
    }
  },

  handleOpenShortcut(event: WechatMiniprogram.BaseEvent) {
    const { path, type } = event.currentTarget.dataset as { path: string; type?: string };
    openRoute(path, type ? { type } : undefined);
  },

  handleCallManager() {
    wx.showModal({
      title: '联系管理员',
      content: '可拨打 400-886-1008，或在管理端补充在线留言能力。',
      showCancel: false,
    });
  },
});
