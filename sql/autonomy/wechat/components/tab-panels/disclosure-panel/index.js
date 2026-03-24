"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const disclosure_1 = require("../../../services/disclosure");
const vote_1 = require("../../../services/vote");
const user_1 = require("../../../services/user");
const session_1 = require("../../../services/session");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
const relationTypeLabelMap = {
    MAIN_OWNER: '业主',
    FAMILY_MEMBER: '家属',
    MAIN_TENANT: '租户',
    CO_RESIDENT: '同住成员',
    AGENT: '代理人',
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
            title: `当前有${count}个投票进行中`,
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
            { label: '参与咨询', value: '待认证' },
        ],
        actions: [
            { title: '立即认证', url: routes_1.ROUTES.profile.bind, theme: 'secondary' },
            { title: '个人中心', url: routes_1.ROUTES.profile.index, theme: 'primary' },
        ],
    };
}
function mapHomeProfileCard(profile) {
    if (!profile?.isVerified || !profile.houseDisplayName) {
        return createDefaultHomeProfileCard();
    }
    return {
        houseName: profile.houseDisplayName,
        houseRole: relationTypeLabelMap[profile.relationType || ''] || '住户',
        statusTag: '已认证',
        communityName: profile.communityName || '已绑定房屋',
        subtitle: `${profile.buildingName || '当前楼栋'} · 微信号已绑定房屋`,
        stats: [
            { label: '房屋成员', value: String(profile.memberCount || 0) },
            { label: '缴费权限', value: profile.canPayBill ? '已开通' : '未开通' },
            { label: '参与咨询', value: profile.canJoinConsultation ? '可参与' : '未开通' },
        ],
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
    data: {
        sections,
        homeProfileCard: createDefaultHomeProfileCard(),
        voteGuideCard: createDefaultVoteGuideCard(),
        latestAnnouncements: [],
        hasBoundHouse: false,
        loadingVoteGuide: false,
        loadingLatest: false,
    },
    lifetimes: {
        attached() {
            void this.loadHomeProfile();
            void this.loadVoteGuide();
            void this.loadLatestAnnouncements();
        },
    },
    methods: {
        async loadHomeProfile() {
            try {
                const hasSession = await (0, session_1.bootstrapWechatSession)();
                if (!hasSession || !app_1.appStore.hasAccessToken()) {
                    this.setData({
                        homeProfileCard: createDefaultHomeProfileCard(),
                        hasBoundHouse: false,
                    });
                    return;
                }
                const user = await (0, user_1.fetchCurrentUser)();
                this.setData({
                    homeProfileCard: mapHomeProfileCard(user.currentHouseProfile),
                    hasBoundHouse: Boolean(user.currentHouseProfile?.houseDisplayName),
                });
            }
            catch (error) {
                console.error('load current user profile failed', error);
                this.setData({
                    homeProfileCard: createDefaultHomeProfileCard(),
                    hasBoundHouse: false,
                });
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
        openVoteGuide() {
            (0, nav_1.navigateTo)(routes_1.ROUTES.voting.index);
        },
    },
});
