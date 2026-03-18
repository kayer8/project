import { ROUTES } from '../../constants/routes';
import { getHomeSections, getOverview } from '../../services/mock';
import {
  ensureAuthenticated,
  hydrateSessionDashboard,
  type SessionCurrentHouseView,
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
    },
    overview: {
      ongoingVoteCount: 0,
      latestDisclosureCount: 0,
      monthlyTasksCount: 0,
      buildingPaidRateSummary: '',
    },
    currentHouse: null as SessionCurrentHouseView | null,
    announcements: [] as ReturnType<typeof getHomeSections>['announcements'],
    voteReminders: [] as ReturnType<typeof getHomeSections>['voteReminders'],
    disclosureHighlights: [] as ReturnType<typeof getHomeSections>['disclosureHighlights'],
    quickActions: [
      { title: '去认证', desc: '提交业主/租户/委员会身份资料', path: ROUTES.auth.identitySelect },
      { title: '参与投票', desc: '查看当前房屋相关表决与征集', path: ROUTES.vote.list },
      { title: '信息公开', desc: '查看公告、管理公开与财务摘要', path: ROUTES.publicity.index },
      { title: '缴费情况', desc: '按楼栋查看管理费收缴率', path: ROUTES.finance.buildingList },
      { title: '我的房屋', desc: '切换房屋并管理成员关系', path: ROUTES.house.list },
      { title: '家庭成员', desc: '查看本户成员、权限与代办状态', path: ROUTES.member.manage },
    ],
  },

  async onShow() {
    if (!ensureAuthenticated()) {
      return;
    }

    const overview = getOverview();
    const sections = getHomeSections();

    try {
      const session = await hydrateSessionDashboard();
      this.setData({
        profile: session.profile,
        overview,
        currentHouse: session.currentHouse,
        announcements: sections.announcements,
        voteReminders: sections.voteReminders,
        disclosureHighlights: sections.disclosureHighlights,
      });
    } catch (error) {
      if (!appStore.hasAccessToken()) {
        ensureAuthenticated();
        return;
      }

      wx.showToast({
        title: error instanceof Error ? error.message : '加载首页失败',
        icon: 'none',
      });
    }
  },

  handleOpenMessage() {
    openRoute(ROUTES.message.index);
  },

  handleOpenHouseSwitch() {
    openRoute(ROUTES.house.switch);
  },

  handleQuickAction(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    openRoute(path);
  },

  handleAnnouncementTap(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.announcementDetail, { id });
  },

  handleVoteTap(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.vote.detail, { id });
  },

  handleDisclosureTap(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.disclosureDetail, { id });
  },
});
