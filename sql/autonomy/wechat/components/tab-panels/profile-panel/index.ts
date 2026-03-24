import { ROUTES } from '../../../constants/routes';
import { bootstrapWechatSession } from '../../../services/session';
import { CurrentUserDetail, fetchCurrentUser } from '../../../services/user';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

type SessionUser = ReturnType<typeof appStore.getSessionUser>;

type ActionItem = {
  key: string;
  label: string;
  desc?: string;
  icon: string;
  url: string;
  requiresHouse: boolean;
};

type TodoItem = {
  key: string;
  title: string;
  note: string;
  badge: string;
  accent: 'blue' | 'orange' | 'green';
  icon: string;
  url: string;
  requiresHouse: boolean;
};

type GuideStep = {
  key: string;
  index: number;
  title: string;
  desc: string;
};

type DisplayHouse = {
  id: string;
  label: string;
  fullLabel: string;
  relationLabel: string;
  isCurrent: boolean;
};

const QUICK_ACTIONS: ActionItem[] = [
  { key: 'vote', label: '投票表决', icon: 'check-circle', url: ROUTES.voting.index, requiresHouse: true },
  { key: 'notice', label: '公告通知', icon: 'notification', url: ROUTES.disclosure.announcements, requiresHouse: false },
  { key: 'repair', label: '报修反馈', icon: 'tools', url: ROUTES.services.repair, requiresHouse: true },
  { key: 'fee', label: '费用公示', icon: 'chart-bar', url: ROUTES.disclosure.payment, requiresHouse: false },
  { key: 'access', label: '门禁通行', icon: 'secured', url: ROUTES.services.access, requiresHouse: true },
  { key: 'visitor', label: '访客登记', icon: 'user-add', url: ROUTES.services.visitor, requiresHouse: true },
];

const PERSONAL_MENUS: ActionItem[] = [
  {
    key: 'vote-record',
    label: '我的投票记录',
    desc: '查看参与过的投票和表决进度',
    icon: 'check-circle',
    url: ROUTES.voting.index,
    requiresHouse: true,
  },
  {
    key: 'repair-record',
    label: '我的报修',
    desc: '查看报修、投诉与处理状态',
    icon: 'tools',
    url: ROUTES.services.repair,
    requiresHouse: true,
  },
  {
    key: 'feedback',
    label: '我的反馈',
    desc: '进入邻里议事与意见反馈入口',
    icon: 'notification',
    url: ROUTES.services.neighbor,
    requiresHouse: true,
  },
  {
    key: 'settings',
    label: '设置',
    desc: '消息提醒、隐私与账号设置',
    icon: 'setting',
    url: ROUTES.profile.settings,
    requiresHouse: false,
  },
  {
    key: 'contact',
    label: '联系物业',
    desc: '查看常用电话与服务联系人',
    icon: 'mail',
    url: ROUTES.services.contacts,
    requiresHouse: false,
  },
];

const GUIDE_STEPS: GuideStep[] = [
  { key: 'phone', index: 1, title: '验证手机号', desc: '通过微信手机号快速匹配住户信息。' },
  { key: 'house', index: 2, title: '选择房屋', desc: '确认楼栋、单元和房屋信息。' },
  { key: 'verify', index: 3, title: '提交认证', desc: '提交后进入审核，完成后即可使用全部功能。' },
];

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '状态获取失败，请稍后重试';
}

function resolveVerificationText(user: CurrentUserDetail | null) {
  if (user?.currentHouseProfile?.isVerified) {
    return '已认证';
  }

  if (user?.latestRegistrationRequest?.status === 'PENDING') {
    return '审核中';
  }

  if (user?.residentStatus === 'REJECTED') {
    return '未通过';
  }

  return '待认证';
}

function resolveRelationLabel(relationLabel?: string | null) {
  if (!relationLabel) {
    return '业主';
  }

  const upper = relationLabel.toUpperCase();
  const relationMap: Record<string, string> = {
    OWNER: '业主',
    FAMILY: '家庭成员',
    TENANT: '租户',
    AGENT: '代理人',
    MEMBER: '家庭成员',
    PRIMARY_OWNER: '业主',
  };

  return relationMap[upper] || relationLabel;
}

function composeHouseLabel(communityName?: string | null, houseLabel?: string | null) {
  if (communityName && houseLabel) {
    return `${communityName}·${houseLabel}`;
  }

  if (houseLabel) {
    return houseLabel;
  }

  if (communityName) {
    return `${communityName}·未绑定房屋`;
  }

  return '未绑定房屋';
}

function buildHouseList(user: CurrentUserDetail | null) {
  if (!user) {
    return [] as DisplayHouse[];
  }

  const communityName = user.currentHouseProfile.communityName || '';
  const currentHouseId = user.currentHouseProfile.houseId || '';
  const deduped = new Map<string, DisplayHouse>();

  user.houseRelations.forEach((item) => {
    const label = item.houseDisplayName || '未命名房屋';
    const id = item.houseId || label;

    deduped.set(id, {
      id,
      label,
      fullLabel: composeHouseLabel(communityName, label),
      relationLabel: resolveRelationLabel(item.relationLabel),
      isCurrent: Boolean(currentHouseId) && currentHouseId === item.houseId,
    });
  });

  if (!deduped.size && user.currentHouseProfile.houseDisplayName) {
    const label = user.currentHouseProfile.houseDisplayName;

    deduped.set(user.currentHouseProfile.houseId || label, {
      id: user.currentHouseProfile.houseId || label,
      label,
      fullLabel: composeHouseLabel(communityName, label),
      relationLabel: resolveRelationLabel(user.currentHouseProfile.relationType),
      isCurrent: true,
    });
  }

  return Array.from(deduped.values());
}

function buildTodoItems(user: CurrentUserDetail | null, hasBoundHouse: boolean, houseCount: number): TodoItem[] {
  const verificationText = resolveVerificationText(user);
  const voteCount = hasBoundHouse ? Math.max(1, Math.min(9, houseCount || 1)) : 0;
  const noticeCount = hasBoundHouse ? 3 : 1;
  const auditItem = (() => {
    if (!hasBoundHouse) {
      return {
        key: 'audit',
        title: '审核中状态',
        note: '尚未绑定房屋，完成绑定后可开启全部自治功能。',
        badge: '去绑定',
        accent: 'orange' as const,
        icon: 'user-time',
        url: ROUTES.register,
        requiresHouse: false,
      };
    }

    if (user?.currentHouseProfile?.isVerified) {
      return {
        key: 'audit',
        title: '审核中状态',
        note: '房屋认证已通过，当前账号可正常使用全部自治服务。',
        badge: '已认证',
        accent: 'green' as const,
        icon: 'user-checked',
        url: ROUTES.profile.verification,
        requiresHouse: true,
      };
    }

    if (user?.latestRegistrationRequest?.status === 'PENDING') {
      return {
        key: 'audit',
        title: '审核中状态',
        note: '认证资料正在审核，请留意审核结果通知。',
        badge: '审核中',
        accent: 'orange' as const,
        icon: 'user-time',
        url: ROUTES.profile.verification,
        requiresHouse: true,
      };
    }

    return {
      key: 'audit',
      title: '审核中状态',
      note: verificationText === '未通过' ? '认证未通过，请补充材料后重新提交。' : '已绑定房屋，继续完成实名认证流程。',
      badge: verificationText === '未通过' ? '去处理' : '去认证',
      accent: 'orange' as const,
      icon: 'user-setting',
      url: ROUTES.profile.verification,
      requiresHouse: true,
    };
  })();

  return [
    {
      key: 'vote',
      title: '待参与投票',
      note: hasBoundHouse ? `你有 ${voteCount} 项表决事项待处理。` : '绑定房屋后可接收业主投票任务。',
      badge: hasBoundHouse ? `${voteCount}项` : '待开启',
      accent: 'blue',
      icon: 'check-circle',
      url: ROUTES.voting.index,
      requiresHouse: true,
    },
    {
      key: 'notice',
      title: '未读公告',
      note: `当前有 ${noticeCount} 条社区公告与物业通知待查看。`,
      badge: `${noticeCount}条`,
      accent: 'blue',
      icon: 'notification',
      url: ROUTES.disclosure.announcements,
      requiresHouse: false,
    },
    auditItem,
  ];
}

Component({
  options: {
    addGlobalClass: true,
    virtualHost: true,
  },

  properties: {
    active: {
      type: Boolean,
      value: false,
      observer(active: boolean) {
        if (active) {
          this.bootstrap();
        }
      },
    },
  },

  data: {
    checking: true,
    hasAccount: false,
    hasBoundHouse: false,
    errorMessage: '',
    sessionUser: null as SessionUser,
    currentUser: null as CurrentUserDetail | null,
    displayName: '微信用户',
    displayInitial: '微',
    identityLabel: '业主',
    houseSummary: '未绑定房屋',
    authStatusText: '未认证',
    verificationText: '待认证',
    availableHouses: [] as DisplayHouse[],
    activeHouseIndex: 0,
    activeHouseLabel: '未绑定房屋',
    houseMetaText: '绑定房屋后可使用全部功能',
    quickActions: QUICK_ACTIONS,
    personalMenus: PERSONAL_MENUS,
    guideSteps: GUIDE_STEPS,
    todoItems: buildTodoItems(null, false, 0),
  },

  lifetimes: {
    attached() {
      if (this.data.active) {
        this.bootstrap();
      }
    },
  },

  methods: {
    syncProfileView(sessionUser: SessionUser, currentUser: CurrentUserDetail | null, hasAccount: boolean, errorMessage = '') {
      const availableHouses = buildHouseList(currentUser);
      const hasBoundHouse = availableHouses.length > 0;
      const activeHouseIndex = Math.max(0, availableHouses.findIndex((item) => item.isCurrent));
      const activeHouse = availableHouses[activeHouseIndex] || null;
      const displayName =
        sessionUser?.realName ||
        sessionUser?.nickname ||
        currentUser?.realName ||
        currentUser?.nickname ||
        '微信用户';
      const displayInitial = displayName.slice(0, 1).toUpperCase();
      const verificationText = resolveVerificationText(currentUser);
      const identityLabel = activeHouse?.relationLabel || resolveRelationLabel(currentUser?.currentHouseProfile.relationType);
      const houseSummary = activeHouse?.fullLabel || composeHouseLabel(currentUser?.currentHouseProfile.communityName, null);
      const authStatusText = hasBoundHouse ? verificationText : '未认证';
      const houseMetaText = hasBoundHouse
        ? `已绑定 ${availableHouses.length} 套房屋，可切换查看当前房屋信息。`
        : '暂未绑定房屋，完成绑定后可使用全部功能。';

      this.setData({
        checking: false,
        hasAccount,
        hasBoundHouse,
        errorMessage,
        sessionUser,
        currentUser,
        displayName,
        displayInitial,
        identityLabel,
        houseSummary,
        authStatusText,
        verificationText,
        availableHouses,
        activeHouseIndex,
        activeHouseLabel: activeHouse?.label || '未绑定房屋',
        houseMetaText,
        todoItems: buildTodoItems(currentUser, hasBoundHouse, availableHouses.length),
      });
    },

    openRoute(url: string) {
      if (!url) {
        return;
      }

      if (url.indexOf('/pages/home/index') === 0) {
        wx.reLaunch({ url });
        return;
      }

      navigateTo(url);
    },

    showBindToast() {
      wx.showToast({
        title: '请先绑定房屋',
        icon: 'none',
      });
    },

    async bootstrap() {
      const cachedUser = appStore.getSessionUser();

      this.setData({
        checking: true,
        errorMessage: '',
      });

      try {
        const hasSession = await bootstrapWechatSession();

        if (!hasSession || !appStore.hasAccessToken()) {
          appStore.clearSession();
          this.syncProfileView(null, null, false);
          return;
        }

        const currentUser = await fetchCurrentUser();
        const sessionUser = {
          id: currentUser.id,
          nickname: currentUser.nickname || '',
          avatarUrl: currentUser.avatarUrl,
          mobile: currentUser.mobile,
          realName: currentUser.realName,
        };

        appStore.setSessionUser(sessionUser);
        this.syncProfileView(sessionUser, currentUser, true);
      } catch (error) {
        this.syncProfileView(cachedUser ?? null, null, Boolean(cachedUser), resolveErrorMessage(error));
      }
    },

    handleQuickActionTap(event: WechatMiniprogram.BaseEvent) {
      const { url, requiresHouse } = event.currentTarget.dataset as { url?: string; requiresHouse?: boolean };

      if (requiresHouse && !this.data.hasBoundHouse) {
        this.showBindToast();
        return;
      }

      if (url) {
        this.openRoute(url);
      }
    },

    handleTodoTap(event: WechatMiniprogram.BaseEvent) {
      const { url, requiresHouse } = event.currentTarget.dataset as { url?: string; requiresHouse?: boolean };

      if (requiresHouse && !this.data.hasBoundHouse) {
        this.goBindHouse();
        return;
      }

      if (url) {
        this.openRoute(url);
      }
    },

    handleMenuTap(event: WechatMiniprogram.BaseEvent) {
      const { url, requiresHouse } = event.currentTarget.dataset as { url?: string; requiresHouse?: boolean };

      if (requiresHouse && !this.data.hasBoundHouse) {
        this.showBindToast();
        return;
      }

      if (url) {
        this.openRoute(url);
      }
    },

    handleSwitchHouse() {
      const { availableHouses, activeHouseIndex, currentUser } = this.data;

      if (!availableHouses.length) {
        this.goBindHouse();
        return;
      }

      if (availableHouses.length === 1) {
        wx.showToast({
          title: '当前仅绑定 1 套房屋',
          icon: 'none',
        });
        return;
      }

      const nextIndex = (activeHouseIndex + 1) % availableHouses.length;
      const activeHouse = availableHouses[nextIndex];

      this.setData({
        activeHouseIndex: nextIndex,
        activeHouseLabel: activeHouse.label,
        houseSummary: activeHouse.fullLabel,
        identityLabel: activeHouse.relationLabel || resolveRelationLabel(currentUser?.currentHouseProfile.relationType),
      });

      wx.showToast({
        title: `已切换为${activeHouse.label}`,
        icon: 'none',
      });
    },

    handleAddHouse() {
      this.goBindHouse();
    },

    goBindHouse() {
      navigateTo(ROUTES.register);
    },

    handleRetry() {
      this.bootstrap();
    },
  },
});
