"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usePullDownRefresh_1 = require("../../../behaviors/usePullDownRefresh");
const routes_1 = require("../../../constants/routes");
const disclosure_1 = require("../../../services/disclosure");
const session_1 = require("../../../services/session");
const user_1 = require("../../../services/user");
const vote_1 = require("../../../services/vote");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
const relationTypeLabelMap = {
    MAIN_OWNER: '业主',
    FAMILY_MEMBER: '家属',
    MAIN_TENANT: '租户',
    CO_RESIDENT: '同住成员',
    AGENT: '代理人',
};
const memberStatusLabelMap = {
    ACTIVE: '已绑定',
    PENDING: '待审核',
    REJECTED: '未通过',
    REMOVED: '已移除',
};
const sections = [
    {
        key: 'vote',
        title: '投票表决',
        url: routes_1.ROUTES.voting.index,
        icon: 'check-circle',
        iconColor: '#2f6bff',
        iconBackground: '#eaf1ff',
        requiresHouse: true,
    },
    {
        key: 'notice',
        title: '公告通知',
        url: routes_1.ROUTES.disclosure.announcements,
        icon: 'notification',
        iconColor: '#2f6bff',
        iconBackground: '#eaf1ff',
        requiresHouse: false,
    },
    {
        key: 'financial',
        title: '财务公开',
        url: routes_1.ROUTES.disclosure.financial,
        icon: 'home',
        iconColor: '#1f9d55',
        iconBackground: '#e9f9ef',
        requiresHouse: false,
    },
    {
        key: 'management',
        title: '管理公开',
        url: routes_1.ROUTES.disclosure.management,
        icon: 'setting',
        iconColor: '#f08c00',
        iconBackground: '#fff4e5',
        requiresHouse: false,
    },
    {
        key: 'payment',
        title: '收费公开',
        url: routes_1.ROUTES.disclosure.payment,
        icon: 'time',
        iconColor: '#8b5cf6',
        iconBackground: '#f3edff',
        requiresHouse: false,
    },
    {
        key: 'repair',
        title: '报修反馈',
        url: routes_1.ROUTES.services.repair,
        icon: 'tools',
        iconColor: '#f08c00',
        iconBackground: '#fff4e5',
        requiresHouse: true,
    },
    {
        key: 'access',
        title: '门禁通行',
        url: routes_1.ROUTES.services.access,
        icon: 'secured',
        iconColor: '#2f6bff',
        iconBackground: '#eaf1ff',
        requiresHouse: true,
    },
    {
        key: 'visitor',
        title: '访客登记',
        url: routes_1.ROUTES.services.visitor,
        icon: 'user-add',
        iconColor: '#1f9d55',
        iconBackground: '#e9f9ef',
        requiresHouse: true,
    },
];
function mapAnnouncement(item) {
    return {
        ...item,
        displayDate: (0, disclosure_1.formatDisclosureDate)((0, disclosure_1.getDisclosureDisplayDate)(item)),
    };
}
function createDefaultVoteGuideCard() {
    return {
        title: '当前暂无进行中的投票',
        buttonText: '查看投票',
    };
}
function createVoteGuideCard(count) {
    if (count > 0) {
        return {
            title: `当前有 ${count} 个投票进行中`,
            buttonText: '去参与',
        };
    }
    return createDefaultVoteGuideCard();
}
function createDefaultHomeProfileCard() {
    return {
        houseName: '未绑定房屋',
        houseRole: null,
        statusTag: null,
        communityName: '暂未绑定小区',
        subtitle: '当前微信号暂无认证房屋信息',
        stats: [
            { label: '房屋成员', value: '0' },
            { label: '缴费权限', value: '未开通' },
            { label: '参与咨询', value: '未绑定' },
        ],
        actions: [
            { title: '立即认证', url: routes_1.ROUTES.profile.bind, theme: 'secondary' },
            { title: '个人中心', url: routes_1.ROUTES.profile.index, theme: 'primary' },
        ],
    };
}
function createDefaultBoundHouseOption() {
    return [];
}
function buildBoundHouseOptions(user) {
    const currentHouseId = user.currentHouseProfile.houseId || '';
    const communityName = user.currentHouseProfile.communityName || '已绑定房屋';
    const relationOptions = user.houseRelations.map((item) => {
        const roleLabel = relationTypeLabelMap[item.relationLabel?.toUpperCase?.() || ''] ||
            item.relationLabel ||
            '住户';
        const isCurrent = Boolean(currentHouseId) && currentHouseId === item.houseId;
        const statusTag = isCurrent && user.residentStatus === 'SYNCED'
            ? '已绑定'
            : memberStatusLabelMap[item.status] || '已绑定';
        return {
            id: item.houseId || item.id,
            houseName: item.houseDisplayName || '未命名房屋',
            fullName: `${communityName}·${item.houseDisplayName || '未命名房屋'}`,
            buildingName: item.buildingName || '当前楼栋',
            roleLabel,
            statusTag,
            subtitle: `${item.buildingName || '当前楼栋'} · ${statusTag}`,
            isCurrent,
        };
    });
    const pendingRequest = user.latestRegistrationRequest;
    const canAppendPendingHouse = pendingRequest?.status === 'PENDING' &&
        Boolean(pendingRequest.houseId) &&
        !relationOptions.some((item) => item.id === pendingRequest.houseId);
    if (!canAppendPendingHouse || !pendingRequest) {
        return relationOptions;
    }
    return [
        ...relationOptions,
        {
            id: `pending:${pendingRequest.id}`,
            houseName: pendingRequest.houseDisplayName || '待审核房屋',
            fullName: `${communityName}路${pendingRequest.houseDisplayName || '待审核房屋'}`,
            buildingName: pendingRequest.buildingName || '待审核楼栋',
            roleLabel: '绑定申请',
            statusTag: '审核中',
            subtitle: `${pendingRequest.buildingName || '待审核楼栋'} 路 审核中`,
            isCurrent: false,
            pendingReview: true,
        },
    ];
}
function buildCardStats(profile, selectedHouse) {
    if (selectedHouse?.isCurrent && profile?.houseDisplayName) {
        return [
            { label: '房屋成员', value: String(profile.memberCount || 0) },
            { label: '缴费权限', value: profile.canPayBill ? '已开通' : '未开通' },
            { label: '参与咨询', value: profile.canJoinConsultation ? '可参与' : '未开通' },
        ];
    }
    if (selectedHouse) {
        return [
            { label: '所在楼栋', value: selectedHouse.buildingName || '--' },
            { label: '绑定状态', value: selectedHouse.statusTag || '已绑定' },
            { label: '身份角色', value: selectedHouse.roleLabel || '住户' },
        ];
    }
    return createDefaultHomeProfileCard().stats;
}
function mapHomeProfileCard(profile, selectedHouse) {
    if (!selectedHouse) {
        return createDefaultHomeProfileCard();
    }
    return {
        houseName: selectedHouse.houseName,
        houseRole: selectedHouse.roleLabel,
        statusTag: selectedHouse.statusTag,
        communityName: profile?.communityName || '已绑定房屋',
        subtitle: selectedHouse.subtitle,
        stats: buildCardStats(profile, selectedHouse),
        actions: [
            { title: '房屋成员', url: routes_1.ROUTES.profile.members, theme: 'secondary' },
            { title: '个人中心', url: routes_1.ROUTES.profile.index, theme: 'primary' },
        ],
    };
}
Component({
    options: {
        addGlobalClass: true,
    },
    behaviors: [usePullDownRefresh_1.usePullDownRefresh],
    data: {
        sections,
        homeProfileCard: createDefaultHomeProfileCard(),
        voteGuideCard: createDefaultVoteGuideCard(),
        latestAnnouncements: [],
        hasBoundHouse: false,
        houseSwitcherVisible: false,
        selectedHouseId: '',
        boundHouses: createDefaultBoundHouseOption(),
        loadingVoteGuide: false,
        loadingLatest: false,
    },
    lifetimes: {
        attached() {
            void this.refreshData();
        },
    },
    methods: {
        async refreshData() {
            await Promise.all([
                this.loadHomeProfile(),
                this.loadVoteGuide(),
                this.loadLatestAnnouncements(),
            ]);
        },
        onPanelRefresh() {
            const instance = this;
            instance.startPullDownRefresh();
            void this.refreshData().finally(() => {
                instance.stopPullDownRefresh();
            });
        },
        async loadHomeProfile() {
            try {
                const hasSession = await (0, session_1.bootstrapWechatSession)();
                if (!hasSession || !app_1.appStore.hasAccessToken()) {
                    this.setData({
                        homeProfileCard: createDefaultHomeProfileCard(),
                        boundHouses: createDefaultBoundHouseOption(),
                        selectedHouseId: '',
                        hasBoundHouse: false,
                    });
                    app_1.appStore.setSelectedHouseId('');
                    return;
                }
                const user = await (0, user_1.fetchCurrentUser)();
                const boundHouses = buildBoundHouseOptions(user);
                const storedHouseId = app_1.appStore.getSelectedHouseId();
                const selectedHouse = boundHouses.find((item) => item.id === storedHouseId && !item.pendingReview) ||
                    boundHouses.find((item) => item.isCurrent) ||
                    boundHouses.find((item) => !item.pendingReview) ||
                    null;
                this.setData({
                    homeProfileCard: mapHomeProfileCard(user.currentHouseProfile, selectedHouse),
                    boundHouses,
                    selectedHouseId: selectedHouse?.id || '',
                    hasBoundHouse: Boolean(user.currentHouseProfile.houseId),
                });
                app_1.appStore.setSelectedHouseId(selectedHouse?.id || '');
            }
            catch (error) {
                console.error('load current user profile failed', error);
                this.setData({
                    homeProfileCard: createDefaultHomeProfileCard(),
                    boundHouses: createDefaultBoundHouseOption(),
                    selectedHouseId: '',
                    hasBoundHouse: false,
                });
                app_1.appStore.setSelectedHouseId('');
            }
        },
        async loadVoteGuide() {
            this.setData({
                loadingVoteGuide: true,
            });
            try {
                const result = await (0, vote_1.fetchVotes)({
                    page: 1,
                    pageSize: 1,
                    status: 'ONGOING',
                });
                this.setData({
                    voteGuideCard: createVoteGuideCard(result.total || 0),
                });
            }
            catch (error) {
                console.error('load vote guide failed', error);
                this.setData({
                    voteGuideCard: createDefaultVoteGuideCard(),
                });
            }
            finally {
                this.setData({
                    loadingVoteGuide: false,
                });
            }
        },
        async loadLatestAnnouncements() {
            this.setData({
                loadingLatest: true,
            });
            try {
                const result = await (0, disclosure_1.fetchDisclosureContents)({
                    category: '通知公告',
                    page: 1,
                    pageSize: 3,
                });
                const announcements = result.items.map(mapAnnouncement);
                this.setData({
                    latestAnnouncements: announcements,
                });
            }
            catch (error) {
                console.error('load disclosure latest announcements failed', error);
                this.setData({
                    latestAnnouncements: [],
                });
            }
            finally {
                this.setData({ loadingLatest: false });
            }
        },
        openDetail(event) {
            const { id } = event.currentTarget.dataset;
            if (!id) {
                return;
            }
            (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
        },
        openSection(event) {
            const { url, requiresHouse } = event.currentTarget.dataset;
            if (!url) {
                return;
            }
            if (requiresHouse && !this.data.hasBoundHouse) {
                wx.showToast({
                    title: '请先绑定房屋',
                    icon: 'none',
                });
                return;
            }
            (0, nav_1.navigateTo)(url);
        },
        openCardAction(event) {
            const { url } = event.currentTarget.dataset;
            if (!url) {
                return;
            }
            (0, nav_1.navigateTo)(url);
        },
        openHouseSwitcher() {
            this.setData({
                houseSwitcherVisible: true,
            });
        },
        handleHouseSwitcherVisibleChange(event) {
            this.setData({
                houseSwitcherVisible: !!event.detail.visible,
            });
        },
        closeHouseSwitcher() {
            this.setData({
                houseSwitcherVisible: false,
            });
        },
        async handleSelectHouse(event) {
            const { id } = event.currentTarget.dataset;
            if (!id) {
                return;
            }
            const { boundHouses, selectedHouseId } = this.data;
            if (selectedHouseId === id) {
                this.setData({ houseSwitcherVisible: false });
                return;
            }
            const selectedHouse = boundHouses.find((item) => item.id === id) || null;
            if (!selectedHouse) {
                return;
            }
            if (selectedHouse.pendingReview) {
                wx.showToast({
                    title: '该房屋正在审核中，审核通过后才可切换使用',
                    icon: 'none',
                });
                return;
            }
            try {
                const hasSession = await (0, session_1.bootstrapWechatSession)();
                if (!hasSession || !app_1.appStore.hasAccessToken()) {
                    this.setData({
                        houseSwitcherVisible: false,
                    });
                    return;
                }
                const user = await (0, user_1.fetchCurrentUser)();
                this.setData({
                    selectedHouseId: id,
                    homeProfileCard: mapHomeProfileCard(user.currentHouseProfile, selectedHouse),
                    houseSwitcherVisible: false,
                });
                app_1.appStore.setSelectedHouseId(id);
            }
            catch (error) {
                console.error('switch home card house failed', error);
            }
        },
        handleBindNewHouse() {
            this.setData({
                houseSwitcherVisible: false,
            });
            (0, nav_1.navigateTo)(routes_1.ROUTES.register);
        },
        openVoteGuide() {
            (0, nav_1.navigateTo)(routes_1.ROUTES.voting.index);
        },
    },
});
