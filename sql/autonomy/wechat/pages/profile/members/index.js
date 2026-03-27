"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const member_1 = require("../../../services/member");
const nav_1 = require("../../../utils/nav");
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '操作失败，请稍后重试';
}
function formatJoinDate(value) {
    if (!value) {
        return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
Page({
    data: {
        houseId: '',
        houseName: '未绑定房屋',
        buildingName: '',
        canManageMembers: false,
        members: [],
        loading: true,
        errorMessage: '',
    },
    onLoad() {
        void this.loadMembers();
    },
    onPullDownRefresh() {
        void this.loadMembers().finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    openInvite() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.invite);
    },
    openPermissions() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.permissions);
    },
    async loadMembers() {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const result = await (0, member_1.fetchCurrentHouseMembers)();
            this.setData({
                houseId: result.houseId || '',
                houseName: result.houseDisplayName || '未绑定房屋',
                buildingName: result.buildingName || '',
                canManageMembers: result.canManageMembers,
                members: result.items.map((item) => ({
                    ...item,
                    joinDateText: formatJoinDate(item.joinDate),
                })),
            });
        }
        catch (error) {
            this.setData({
                errorMessage: resolveErrorMessage(error),
                members: [],
            });
        }
        finally {
            this.setData({
                loading: false,
            });
        }
    },
    async handleRemove(event) {
        const { id, name } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '移除成员',
                content: `确认将${name || '该成员'}移出当前房屋吗？`,
                confirmText: '确认移除',
                cancelText: '取消',
                success: (res) => resolve(res.confirm),
                fail: () => resolve(false),
            });
        });
        if (!confirmed) {
            return;
        }
        try {
            await (0, member_1.removeCurrentHouseMember)(id);
            wx.showToast({
                title: '成员已移除',
                icon: 'success',
            });
            await this.loadMembers();
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
    },
});
