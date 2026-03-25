"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        url: routes_1.ROUTES.voting.index,
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
function resolveVerificationText(user) {
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
    };
    return relationMap[upper] || relationLabel;
}
function composeHouseLabel(communityName, houseLabel) {
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
Component({
    options: {
        addGlobalClass: true,
        virtualHost: true,
    },
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
        displayName: '微信用户',
        displayInitial: '微',
        identityLabel: '业主',
        houseSummary: '未绑定房屋',
        authStatusText: '未认证',
        verificationText: '待认证',
        availableHouses: [],
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
        syncProfileView(sessionUser, currentUser, hasAccount, errorMessage = '') {
            const availableHouses = buildHouseList(currentUser);
            const hasBoundHouse = availableHouses.length > 0;
            const activeHouseIndex = Math.max(0, availableHouses.findIndex((item) => item.isCurrent));
            const activeHouse = availableHouses[activeHouseIndex] || null;
            const displayName = sessionUser?.realName ||
                sessionUser?.nickname ||
                currentUser?.realName ||
                currentUser?.nickname ||
                '微信用户';
            const displayInitial = displayName.slice(0, 1).toUpperCase();
            const verificationText = resolveVerificationText(currentUser);
            const identityLabel = activeHouse?.relationLabel ||
                resolveRelationLabel(currentUser?.currentHouseProfile.relationType);
            const houseSummary = activeHouse?.fullLabel ||
                composeHouseLabel(currentUser?.currentHouseProfile.communityName, null);
            const authStatusText = hasBoundHouse ? verificationText : '未认证';
            const houseMetaText = hasBoundHouse
                ? `已绑定 ${availableHouses.length} 套房屋，可切换查看当前房屋信息。`
                : '如物业已登记手机号，可尝试一键绑定。';
            const showAutoBindGuide = !currentUser?.currentHouseProfile?.isVerified;
            this.setData({
                checking: false,
                hasAccount,
                hasBoundHouse,
                showAutoBindGuide,
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
                        content: '已根据物业登记手机号自动绑定房屋。',
                        showCancel: false,
                    });
                    return;
                }
                wx.showModal({
                    title: '未匹配到登记信息',
                    content: '该手机号暂未匹配到物业登记房屋，请核对手机号或继续手动绑定房屋。',
                    confirmText: '去手动绑定',
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
                identityLabel: activeHouse.relationLabel ||
                    resolveRelationLabel(currentUser?.currentHouseProfile.relationType),
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
            (0, nav_1.navigateTo)(routes_1.ROUTES.register);
        },
        handleRetry() {
            this.bootstrap();
        },
    },
});
