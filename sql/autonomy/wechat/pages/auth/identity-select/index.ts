import { ROUTES } from '../../../constants/routes';
import {
  ensureAuthenticated,
  hydrateSessionDashboard,
  type SessionProfileView,
} from '../../../services/session';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

type AuthIdentityType = 'OWNER' | 'TENANT' | 'COMMITTEE';

const identityCards: Array<{
  type: AuthIdentityType;
  title: string;
  desc: string;
  path: string;
}> = [
  {
    type: 'OWNER',
    title: '业主认证',
    desc: '用于房屋主角色、家庭成员和代理人认证。',
    path: ROUTES.auth.ownerSubmit,
  },
  {
    type: 'TENANT',
    title: '租户认证',
    desc: '用于主租户、同住成员和租住授权场景。',
    path: ROUTES.auth.tenantSubmit,
  },
  {
    type: 'COMMITTEE',
    title: '委员会认证',
    desc: '用于发起投票、发布公开与社区治理工作。',
    path: ROUTES.auth.committeeSubmit,
  },
];

Page({
  data: {
    identityCards,
    profile: {
      nickname: '',
      avatar: '',
      communityName: '',
      currentIdentityLabel: '',
      authStatusLabel: '',
      unreadCount: 0,
    } as SessionProfileView,
  },

  async onShow() {
    if (!ensureAuthenticated()) {
      return;
    }

    try {
      const session = await hydrateSessionDashboard();
      this.setData({
        profile: session.profile,
      });
    } catch (error) {
      if (!appStore.hasAccessToken()) {
        ensureAuthenticated();
        return;
      }

      wx.showToast({
        title: error instanceof Error ? error.message : '加载身份信息失败',
        icon: 'none',
      });
    }
  },

  handleOpenRules() {
    navigateTo(ROUTES.auth.rules);
  },

  handleSelect(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    navigateTo(path);
  },
});
