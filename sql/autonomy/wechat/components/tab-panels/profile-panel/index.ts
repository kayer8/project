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

type DisplayHouse = {
  id: string;
  label: string;
  fullLabel: string;
  relationLabel: string;
  isCurrent: boolean;
};

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
    personalMenus: PERSONAL_MENUS,
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
        : '暂未绑定房屋，可先添加房屋。';

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
