"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const auth_1 = require("../../services/auth");
const app_1 = require("../../store/app");
const nav_1 = require("../../utils/nav");
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '操作失败，请稍后重试';
}
function maskMobile(mobile) {
    if (!mobile || mobile.length < 11) {
        return mobile || '';
    }
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`;
}
Page({
    data: {
        phase: 'phone',
        submitting: false,
        loadingOptions: false,
        mobile: '',
        mobileMasked: '',
        syncMessage: '',
        buildingOptions: [],
        houseOptions: [],
        buildingIndex: 0,
        houseIndex: 0,
        selectedBuildingId: '',
        selectedHouseId: '',
    },
    async handleGetPhoneNumber(event) {
        const detail = event.detail;
        if (!detail.code || detail.errMsg !== 'getPhoneNumber:ok') {
            wx.showToast({
                title: '未获取到手机号授权',
                icon: 'none',
            });
            return;
        }
        this.setData({ submitting: true });
        try {
            const code = await (0, auth_1.getWechatLoginCode)();
            const result = await (0, auth_1.syncWechatPhone)({
                code,
                phoneCode: detail.code,
            });
            app_1.appStore.setAccessToken(result.accessToken);
            app_1.appStore.setSessionUser(result.user);
            if (result.matched) {
                wx.showModal({
                    title: '同步成功',
                    content: result.message,
                    showCancel: false,
                    success: () => {
                        (0, nav_1.reLaunch)(routes_1.ROUTES.home);
                    },
                });
                return;
            }
            this.setData({
                phase: 'form',
                mobile: result.mobile || result.user.mobile || '',
                mobileMasked: maskMobile(result.mobile || result.user.mobile || ''),
                syncMessage: result.message,
            });
            await this.loadBuildingOptions();
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
    async loadBuildingOptions() {
        this.setData({ loadingOptions: true });
        try {
            const buildingOptions = await (0, auth_1.listRegisterBuildings)();
            const selectedBuildingId = buildingOptions[0]?.id || '';
            this.setData({
                buildingOptions,
                buildingIndex: 0,
                selectedBuildingId,
                selectedHouseId: '',
                houseOptions: [],
                houseIndex: 0,
            });
            if (selectedBuildingId) {
                await this.loadHouseOptions(selectedBuildingId);
            }
        }
        finally {
            this.setData({ loadingOptions: false });
        }
    },
    async loadHouseOptions(buildingId) {
        const houseOptions = await (0, auth_1.listRegisterHouses)(buildingId);
        this.setData({
            houseOptions,
            houseIndex: 0,
            selectedHouseId: houseOptions[0]?.id || '',
        });
    },
    async handleBuildingChange(event) {
        const index = Number(event.detail.value || 0);
        const building = this.data.buildingOptions[index];
        this.setData({
            buildingIndex: index,
            selectedBuildingId: building?.id || '',
            selectedHouseId: '',
            houseOptions: [],
            houseIndex: 0,
        });
        if (building?.id) {
            await this.loadHouseOptions(building.id);
        }
    },
    handleHouseChange(event) {
        const index = Number(event.detail.value || 0);
        const house = this.data.houseOptions[index];
        this.setData({
            houseIndex: index,
            selectedHouseId: house?.id || '',
        });
    },
    async handleSubmitRequest() {
        if (!this.data.selectedBuildingId) {
            wx.showToast({
                title: '请先选择楼栋',
                icon: 'none',
            });
            return;
        }
        this.setData({ submitting: true });
        try {
            await (0, auth_1.submitRegistrationRequest)({
                buildingId: this.data.selectedBuildingId,
                houseId: this.data.selectedHouseId || undefined,
            });
            wx.showToast({
                title: '提交成功',
                icon: 'success',
            });
            setTimeout(() => {
                (0, nav_1.reLaunch)(routes_1.ROUTES.home);
            }, 300);
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
    openPrivacy() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.legal.privacy);
    },
});
