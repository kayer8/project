"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usePullDownRefresh_1 = require("../../../behaviors/usePullDownRefresh");
const routes_1 = require("../../../constants/routes");
const auth_1 = require("../../../services/auth");
const session_1 = require("../../../services/session");
const user_1 = require("../../../services/user");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
const PERSONAL_MENUS = [
    {
        key: 'vote-record',
        label: '我的投票记录',
        icon: 'check-circle',
        url: routes_1.ROUTES.profile.votes,
        requiresHouse: true,
    },
    {
        key: 'repair-record',
        label: '我的报修',
        icon: 'tools',
        url: routes_1.ROUTES.services.repair,
        requiresHouse: true,
    },
    {
        key: 'feedback',
        label: '我的反馈',
        icon: 'notification',
        url: routes_1.ROUTES.services.neighbor,
        requiresHouse: true,
    },
    {
        key: 'settings',
        label: '设置',
        icon: 'setting',
        url: routes_1.ROUTES.profile.settings,
        requiresHouse: false,
    },
    {
        key: 'contact',
        label: '联系物业',
        icon: 'mail',
        url: routes_1.ROUTES.services.contacts,
        requiresHouse: false,
    },
];
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '状态获取失败，请稍后重试';
}
function resolveRelationLabel(relationLabel) {
    if (!relationLabel) {
        return '业主';
    }
    const upper = relationLabel.toUpperCase();
    const relationMap = {
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
function composeHouseLabel(communityName, houseLabel) {
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
function buildHouseList(user) {
    if (!user) {
        return [];
    }
    const communityName = user.currentHouseProfile.communityName || '';
    const currentHouseId = user.currentHouseProfile.houseId || '';
    const deduped = new Map();
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
function normalizeMobile(value) {
    return value.replace(/\s+/g, '').trim();
}
function isMainlandMobile(value) {
    return /^1\d{10}$/.test(value);
}
function buildPaymentCardView(user, hasBoundHouse) {
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
        const headline = paymentSummary.currentHouseUnpaidCount === 1
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
            amountText: paymentSummary.totalUnpaidCount === 1
                ? '1 笔未缴'
                : `共 ${paymentSummary.totalUnpaidCount} 笔未缴`,
            tone: 'warning',
        };
    }
    if (paymentSummary.hasOtherHouseUnpaid) {
        const otherHouseText = paymentSummary.otherHouseCountWithUnpaid > 1
            ? `其他 ${paymentSummary.otherHouseCountWithUnpaid} 套绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔未缴，请留意处理。`
            : `其他绑定房屋还有 ${paymentSummary.otherHouseUnpaidCount} 笔未缴，请留意处理。`;
        return {
            headline: '当前房屋已缴纳',
            description: otherHouseText,
            amountText: paymentSummary.otherHouseUnpaidCount === 1
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
    behaviors: [usePullDownRefresh_1.usePullDownRefresh],
    properties: {
        active: {
            type: Boolean,
            value: false,
            observer(active) {
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
        sessionUser: null,
        currentUser: null,
        displayInitial: '微',
        identityLabel: '业主',
        houseSummary: '未绑定房屋',
        mobileText: '未绑定手机号',
        paymentHeadline: '绑定后可查看缴费状态',
        paymentDescription: '完成房屋绑定后，可查看当前房屋和其他已绑定房屋的缴费提醒。',
        paymentAmountText: '待绑定',
        paymentTone: 'neutral',
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
            const instance = this;
            instance.startPullDownRefresh();
            void this.refreshData().finally(() => {
                instance.stopPullDownRefresh();
            });
        },
        syncProfileView(sessionUser, currentUser, hasAccount, errorMessage = '') {
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
                identityLabel: activeHouse?.relationLabel ||
                    resolveRelationLabel(currentUser?.currentHouseProfile.relationType),
                houseSummary: activeHouse?.label ||
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
        openRoute(url) {
            if (!url) {
                return;
            }
            if (url.indexOf('/pages/home/index') === 0) {
                wx.reLaunch({ url });
                return;
            }
            (0, nav_1.navigateTo)(url);
        },
        showBindToast() {
            wx.showToast({
                title: '请先绑定房屋',
                icon: 'none',
            });
        },
        async bootstrap() {
            const cachedUser = app_1.appStore.getSessionUser();
            this.setData({
                checking: true,
                errorMessage: '',
            });
            try {
                const hasSession = await (0, session_1.bootstrapWechatSession)();
                if (!hasSession || !app_1.appStore.hasAccessToken()) {
                    app_1.appStore.clearSession();
                    this.syncProfileView(null, null, false);
                    return;
                }
                const currentUser = await (0, user_1.fetchCurrentUser)();
                const sessionUser = {
                    id: currentUser.id,
                    nickname: currentUser.nickname || '',
                    avatarUrl: currentUser.avatarUrl,
                    mobile: currentUser.mobile,
                    realName: currentUser.realName,
                };
                app_1.appStore.setSessionUser(sessionUser);
                this.syncProfileView(sessionUser, currentUser, true);
            }
            catch (error) {
                this.syncProfileView(cachedUser ?? null, null, Boolean(cachedUser), resolveErrorMessage(error));
            }
        },
        async handleManualBindTap() {
            const result = await new Promise((resolve) => {
                wx.showModal({
                    title: '输入登记手机号',
                    editable: true,
                    placeholderText: '请输入物业登记的手机号',
                    confirmText: '确认校验',
                    cancelText: '取消',
                    success: resolve,
                    fail: () => resolve({ confirm: false, cancel: true, content: '', errMsg: 'showModal:fail' }),
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
                const code = await (0, auth_1.getWechatLoginCode)();
                const bindResult = await (0, auth_1.manualBindWechatPhone)({
                    code,
                    mobile,
                });
                app_1.appStore.setAccessToken(bindResult.accessToken);
                app_1.appStore.setSessionUser(bindResult.user);
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
            }
            catch (error) {
                wx.showToast({
                    title: resolveErrorMessage(error),
                    icon: 'none',
                });
            }
            finally {
                this.setData({ oneClickBinding: false });
            }
        },
        handleMenuTap(event) {
            const { url, requiresHouse } = event.currentTarget.dataset;
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
            (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.payment);
        },
        handleAddHouse() {
            this.goBindHouse();
        },
        goBindHouse() {
            (0, nav_1.navigateTo)(routes_1.ROUTES.register);
        },
        handleRetry() {
            this.bootstrap();
        },
    },
});
