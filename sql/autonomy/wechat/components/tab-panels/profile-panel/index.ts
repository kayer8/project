import { usePullDownRefresh } from '../../../behaviors/usePullDownRefresh';
import { ROUTES } from '../../../constants/routes';
import { getWechatLoginCode, manualBindWechatPhone } from '../../../services/auth';
import { bootstrapWechatSession } from '../../../services/session';
import { CurrentUserDetail, fetchCurrentUser } from '../../../services/user';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

type SessionUser = ReturnType<typeof appStore.getSessionUser>;

type ActionItem = {
  key: string;
  label: string;
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

type PaymentCardView = {
  headline: string;
  description: string;
  amountText: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
};

const PERSONAL_MENUS: ActionItem[] = [
  {
    key: 'vote-record',
    label: '我的投票记录',
    icon: 'check-circle',
    url: ROUTES.profile.votes,
    requiresHouse: true,
  },
  {
    key: 'repair-record',
    label: '我的报修',
    icon: 'tools',
    url: ROUTES.services.repair,
    requiresHouse: true,
  },
  {
    key: 'feedback',
    label: '我的反馈',
    icon: 'notification',
    url: ROUTES.services.neighbor,
    requiresHouse: true,
  },
  {
    key: 'settings',
    label: '设置',
    icon: 'setting',
    url: ROUTES.profile.settings,
    requiresHouse: false,
  },
  {
    key: 'contact',
    label: '联系物业',
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
    MAIN_OWNER: '业主',
    FAMILY_MEMBER: '家庭成员',
    MAIN_TENANT: '租户',
    CO_RESIDENT: '同住成员',
  };

  return relationMap[upper] || relationLabel;
}

function composeHouseLabel(communityName?: string | null, houseLabel?: string | null) {
  if (communityName && houseLabel) {
    return `${communityName} · ${houseLabel}`;
  }

  if (houseLabel) {
    return houseLabel;
  }

  if (communityName) {
    return `${communityName} · 未绑定房屋`;
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

function normalizeMobile(value: string) {
  return value.replace(/\s+/g, '').trim();
}

function isMainlandMobile(value: string) {
  return /^1\d{10}$/.test(value);
}

function buildPaymentCardView(user: CurrentUserDetail | null, hasBoundHouse: boolean): PaymentCardView {
  if (!hasBoundHouse || !user?.currentHouseProfile.houseId) {
    return {
      headline: '绑定后可查看缴费状态',
      description: '完成房屋绑定后，可查看当前房屋和其他已绑定房屋的缴费提醒。',
      amountText: '待绑定',
      tone: 'neutral',
    };
  }

  const paymentSummary = user.currentHouseProfile.paymentSummary;
  if (!paymentSummary) {
    return {
      headline: '当前已缴纳',
      description: '当前房屋和其他已绑定房屋均无未到期待缴账单。',
      amountText: '暂无待缴',
      tone: 'success',
    };
  }

  if (paymentSummary.hasCurrentHouseUnpaid) {
    const headline =
      paymentSummary.currentHouseUnpaidCount === 1
        ? '当前房屋有 1 笔待缴'
        : `当前房屋有 ${paymentSummary.currentHouseUnpaidCount} 笔待缴`;
    const description = paymentSummary.hasOtherHouseUnpaid
      ? paymentSummary.otherHouseCountWithUnpaid > 1
        ? `另外 ${paymentSummary.otherHouseCountWithUnpaid} 套已绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔待缴，请一并留意。`
        : `另外 1 套已绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔待缴，请一并留意。`
      : '均为未过期账单，可前往收费公示查看并处理。';

    return {
      headline,
      description,
      amountText:
        paymentSummary.totalUnpaidCount === 1
          ? '1 笔未缴'
          : `共 ${paymentSummary.totalUnpaidCount} 笔未缴`,
      tone: 'warning',
    };
  }

  if (paymentSummary.hasOtherHouseUnpaid) {
    const otherHouseText =
      paymentSummary.otherHouseCountWithUnpaid > 1
        ? `其他 ${paymentSummary.otherHouseCountWithUnpaid} 套绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔未缴，请留意处理。`
        : `其他绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔未缴，请留意处理。`;

    return {
      headline: '当前房屋已缴纳',
      description: otherHouseText,
      amountText:
        paymentSummary.otherHouseUnpaidCount === 1
          ? '其他房屋 1 笔未缴'
          : `其他房屋 ${paymentSummary.otherHouseUnpaidCount} 笔未缴`,
      tone: 'warning',
    };
  }

  return {
    headline: '当前已缴纳',
    description: '当前房屋和其他已绑定房屋均无未到期待缴账单。',
    amountText: '暂无待缴',
    tone: 'success',
  };
}

Component({
  options: {
    addGlobalClass: true,
    virtualHost: true,
  },

  behaviors: [usePullDownRefresh],

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
    oneClickBinding: false,
    hasAccount: false,
    hasBoundHouse: false,
    showAutoBindGuide: true,
    errorMessage: '',
    sessionUser: null as SessionUser,
    currentUser: null as CurrentUserDetail | null,
    displayInitial: '微',
    identityLabel: '业主',
    houseSummary: '未绑定房屋',
    mobileText: '未绑定手机号',
    paymentHeadline: '绑定后可查看缴费状态',
    paymentDescription: '完成房屋绑定后，可查看当前房屋和其他已绑定房屋的缴费提醒。',
    paymentAmountText: '待绑定',
    paymentTone: 'neutral' as 'success' | 'warning' | 'danger' | 'neutral',
    houseCountText: '暂无绑定房屋',
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
    async refreshData() {
      await this.bootstrap();
    },

    onPanelRefresh() {
      const instance = this as unknown as WechatMiniprogram.Component.TrivialInstance & {
        startPullDownRefresh: () => void;
        stopPullDownRefresh: () => void;
      };

      instance.startPullDownRefresh();
      void this.refreshData().finally(() => {
        instance.stopPullDownRefresh();
      });
    },

    syncProfileView(
      sessionUser: SessionUser,
      currentUser: CurrentUserDetail | null,
      hasAccount: boolean,
      errorMessage = '',
    ) {
      const availableHouses = buildHouseList(currentUser);
      const hasBoundHouse = availableHouses.length > 0;
      const activeHouse = availableHouses.find((item) => item.isCurrent) || availableHouses[0] || null;
      const paymentCard = buildPaymentCardView(currentUser, hasBoundHouse);
      const mobileText = sessionUser?.mobile || currentUser?.mobile || '未绑定手机号';

      this.setData({
        checking: false,
        hasAccount,
        hasBoundHouse,
        showAutoBindGuide: currentUser?.residentStatus !== 'SYNCED',
        errorMessage,
        sessionUser,
        currentUser,
        displayInitial: (sessionUser?.realName || sessionUser?.nickname || currentUser?.nickname || '微')
          .slice(0, 1)
          .toUpperCase(),
        identityLabel:
          activeHouse?.relationLabel ||
          resolveRelationLabel(currentUser?.currentHouseProfile.relationType),
        houseSummary:
          activeHouse?.label ||
          currentUser?.currentHouseProfile.houseDisplayName ||
          '未绑定房屋',
        mobileText,
        paymentHeadline: paymentCard.headline,
        paymentDescription: paymentCard.description,
        paymentAmountText: paymentCard.amountText,
        paymentTone: paymentCard.tone,
        houseCountText: hasBoundHouse ? `已绑定 ${availableHouses.length} 套房屋` : '暂无绑定房屋',
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

    async handleManualBindTap() {
      const result = await new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>((resolve) => {
        wx.showModal({
          title: '输入登记手机号',
          editable: true,
          placeholderText: '请输入物业登记的手机号',
          confirmText: '确认校验',
          cancelText: '取消',
          success: resolve,
          fail: () =>
            resolve({ confirm: false, cancel: true, content: '', errMsg: 'showModal:fail' }),
        });
      });

      if (!result.confirm) {
        return;
      }

      const mobile = normalizeMobile(result.content || '');
      if (!isMainlandMobile(mobile)) {
        wx.showToast({
          title: '请输入 11 位手机号',
          icon: 'none',
        });
        return;
      }

      this.setData({ oneClickBinding: true });

      try {
        const code = await getWechatLoginCode();
        const bindResult = await manualBindWechatPhone({
          code,
          mobile,
        });

        appStore.setAccessToken(bindResult.accessToken);
        appStore.setSessionUser(bindResult.user);

        await this.bootstrap();

        if (bindResult.matched) {
          wx.showModal({
            title: '一键绑定成功',
            content: '已根据物业登记手机号自动绑定对应房屋。',
            showCancel: false,
          });
          return;
        }

        wx.showModal({
          title: '未匹配到登记信息',
          content: '该手机号暂未匹配到物业登记房屋，请核对手机号或继续手动绑定房屋。',
          confirmText: '去绑定房屋',
          cancelText: '稍后再说',
          success: (res) => {
            if (res.confirm) {
              this.goBindHouse();
            }
          },
        });
      } catch (error) {
        wx.showToast({
          title: resolveErrorMessage(error),
          icon: 'none',
        });
      } finally {
        this.setData({ oneClickBinding: false });
      }
    },

    handleMenuTap(event: WechatMiniprogram.BaseEvent) {
      const { url, requiresHouse } = event.currentTarget.dataset as {
        url?: string;
        requiresHouse?: boolean;
      };

      if (requiresHouse && !this.data.hasBoundHouse) {
        this.showBindToast();
        return;
      }

      if (url) {
        this.openRoute(url);
      }
    },

    handlePaymentTap() {
      if (!this.data.hasBoundHouse) {
        this.showBindToast();
        return;
      }

      navigateTo(ROUTES.disclosure.payment);
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
