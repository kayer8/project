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
function confirmSubmit(buildingName, houseName) {
    return new Promise((resolve) => {
        wx.showModal({
            title: '确认提交',
            content: `楼栋：${buildingName}\n房屋：${houseName || '暂未选择'}\n\n提交后将进入人工审核。`,
            confirmText: '确认提交',
            cancelText: '再看看',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false),
        });
    });
}
function getPickerResult(event) {
    const values = Array.isArray(event.detail.value) ? event.detail.value : [];
    const labels = Array.isArray(event.detail.label) ? event.detail.label : [];
    return {
        value: values[0] || '',
        label: labels[0] || '',
    };
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
        buildingPickerOptions: [],
        housePickerOptions: [],
        buildingPickerVisible: false,
        housePickerVisible: false,
        buildingPickerValue: [],
        housePickerValue: [],
        selectedBuildingId: '',
        selectedBuildingName: '',
        selectedHouseId: '',
        selectedHouseName: '',
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
                        (0, nav_1.reLaunch)(routes_1.ROUTES.profile.index);
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
            const buildingPickerOptions = buildingOptions.map((item) => ({
                label: item.buildingName,
                value: item.id,
            }));
            this.setData({
                buildingOptions,
                buildingPickerOptions,
                buildingPickerValue: [],
                selectedBuildingId: '',
                selectedBuildingName: '',
                selectedHouseId: '',
                selectedHouseName: '',
                houseOptions: [],
                housePickerOptions: [],
                housePickerValue: [],
            });
            if (!buildingOptions.length) {
                wx.showToast({
                    title: '暂无可选楼栋，请联系管理员',
                    icon: 'none',
                });
            }
        }
        finally {
            this.setData({ loadingOptions: false });
        }
    },
    async loadHouseOptions(buildingId) {
        const houseOptions = await (0, auth_1.listRegisterHouses)(buildingId);
        const housePickerOptions = houseOptions.map((item) => ({
            label: item.displayName,
            value: item.id,
        }));
        this.setData({
            houseOptions,
            housePickerOptions,
            housePickerValue: [],
            selectedHouseId: '',
            selectedHouseName: '',
        });
    },
    openBuildingPicker() {
        if (!this.data.buildingPickerOptions.length) {
            return;
        }
        this.setData({
            buildingPickerVisible: true,
            buildingPickerValue: [this.data.selectedBuildingId || this.data.buildingPickerOptions[0].value],
        });
    },
    handleBuildingPickerVisibleChange(event) {
        this.setData({ buildingPickerVisible: !!event.detail.visible });
    },
    closeBuildingPicker() {
        this.setData({ buildingPickerVisible: false });
    },
    async handleBuildingConfirm(event) {
        const selected = getPickerResult(event);
        this.setData({
            buildingPickerVisible: false,
            buildingPickerValue: selected.value ? [selected.value] : [],
            selectedBuildingId: selected.value,
            selectedBuildingName: selected.label,
            selectedHouseId: '',
            selectedHouseName: '',
            houseOptions: [],
            housePickerOptions: [],
            housePickerValue: [],
        });
        if (!selected.value) {
            return;
        }
        try {
            await this.loadHouseOptions(selected.value);
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
    },
    openHousePicker() {
        if (!this.data.housePickerOptions.length) {
            return;
        }
        this.setData({
            housePickerVisible: true,
            housePickerValue: [this.data.selectedHouseId || this.data.housePickerOptions[0].value],
        });
    },
    handleHousePickerVisibleChange(event) {
        this.setData({ housePickerVisible: !!event.detail.visible });
    },
    closeHousePicker() {
        this.setData({ housePickerVisible: false });
    },
    handleHouseConfirm(event) {
        const selected = getPickerResult(event);
        this.setData({
            housePickerVisible: false,
            housePickerValue: selected.value ? [selected.value] : [],
            selectedHouseId: selected.value,
            selectedHouseName: selected.label,
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
        const confirmed = await confirmSubmit(this.data.selectedBuildingName || '未选择楼栋', this.data.selectedHouseName);
        if (!confirmed) {
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
                (0, nav_1.reLaunch)(routes_1.ROUTES.profile.index);
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
