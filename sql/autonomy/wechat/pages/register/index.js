"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const auth_1 = require("../../services/auth");
const app_1 = require("../../store/app");
const nav_1 = require("../../utils/nav");
const UNKNOWN_FLOOR_VALUE = '__UNKNOWN_FLOOR__';
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '操作失败，请稍后重试';
}
function getPickerResult(event) {
    const values = Array.isArray(event.detail.value) ? event.detail.value : [];
    const labels = Array.isArray(event.detail.label) ? event.detail.label : [];
    return {
        value: values[0] || '',
        label: labels[0] || '',
    };
}
function normalizeMobile(value) {
    return value.replace(/\D/g, '').slice(0, 11);
}
function isValidMobile(value) {
    return /^1\d{10}$/.test(value);
}
function getFloorValue(floorNo) {
    return floorNo === null ? UNKNOWN_FLOOR_VALUE : String(floorNo);
}
function getFloorLabel(floorNo) {
    return floorNo === null ? '未设置楼层' : `${floorNo}层`;
}
function buildFloorOptions(houses) {
    const seen = new Set();
    const options = [];
    houses.forEach((item) => {
        const value = getFloorValue(item.floorNo);
        if (seen.has(value)) {
            return;
        }
        seen.add(value);
        options.push({
            label: getFloorLabel(item.floorNo),
            value,
        });
    });
    return options;
}
function buildRoomOptions(houses, floorValue) {
    return houses
        .filter((item) => getFloorValue(item.floorNo) === floorValue)
        .map((item) => ({
        label: item.roomNo || item.displayName,
        value: item.id,
    }));
}
function confirmSubmit(mobile, houseName) {
    return new Promise((resolve) => {
        wx.showModal({
            title: '确认提交',
            content: `手机号：${mobile}\n房屋：${houseName}\n\n系统将先按手机号匹配物业登记信息，未命中时会提交人工审核。`,
            confirmText: '确认提交',
            cancelText: '再看看',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false),
        });
    });
}
Page({
    data: {
        submitting: false,
        loadingBuildings: false,
        loadingHouses: false,
        mobile: '',
        buildingOptions: [],
        houseOptions: [],
        buildingPickerOptions: [],
        floorPickerOptions: [],
        roomPickerOptions: [],
        buildingPickerVisible: false,
        floorPickerVisible: false,
        roomPickerVisible: false,
        buildingPickerValue: [],
        floorPickerValue: [],
        roomPickerValue: [],
        selectedBuildingId: '',
        selectedBuildingName: '',
        selectedFloorValue: '',
        selectedFloorLabel: '',
        selectedHouseId: '',
        selectedRoomLabel: '',
        selectedHouseName: '',
    },
    onLoad() {
        this.bootstrap();
    },
    async bootstrap() {
        this.setData({
            loadingBuildings: true,
        });
        try {
            const buildingOptions = await (0, auth_1.listRegisterBuildings)();
            const buildingPickerOptions = buildingOptions.map((item) => ({
                label: item.buildingName,
                value: item.id,
            }));
            this.setData({
                buildingOptions,
                buildingPickerOptions,
            });
            if (!buildingOptions.length) {
                wx.showToast({
                    title: '暂无可选择的楼栋，请联系物业处理',
                    icon: 'none',
                });
            }
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
        finally {
            this.setData({
                loadingBuildings: false,
            });
        }
    },
    handleMobileChange(event) {
        this.setData({
            mobile: normalizeMobile(event.detail.value || ''),
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
            selectedFloorValue: '',
            selectedFloorLabel: '',
            selectedHouseId: '',
            selectedRoomLabel: '',
            selectedHouseName: '',
            floorPickerOptions: [],
            floorPickerValue: [],
            roomPickerOptions: [],
            roomPickerValue: [],
            houseOptions: [],
        });
        if (!selected.value) {
            return;
        }
        this.setData({
            loadingHouses: true,
        });
        try {
            const houseOptions = await (0, auth_1.listRegisterHouses)(selected.value);
            const floorPickerOptions = buildFloorOptions(houseOptions);
            this.setData({
                houseOptions,
                floorPickerOptions,
            });
            if (!houseOptions.length) {
                wx.showToast({
                    title: '该楼栋暂无可登记房屋',
                    icon: 'none',
                });
            }
        }
        catch (error) {
            wx.showToast({
                title: resolveErrorMessage(error),
                icon: 'none',
            });
        }
        finally {
            this.setData({
                loadingHouses: false,
            });
        }
    },
    openFloorPicker() {
        if (!this.data.floorPickerOptions.length) {
            return;
        }
        this.setData({
            floorPickerVisible: true,
            floorPickerValue: [this.data.selectedFloorValue || this.data.floorPickerOptions[0].value],
        });
    },
    handleFloorPickerVisibleChange(event) {
        this.setData({ floorPickerVisible: !!event.detail.visible });
    },
    closeFloorPicker() {
        this.setData({ floorPickerVisible: false });
    },
    handleFloorConfirm(event) {
        const selected = getPickerResult(event);
        const roomPickerOptions = buildRoomOptions(this.data.houseOptions, selected.value);
        this.setData({
            floorPickerVisible: false,
            floorPickerValue: selected.value ? [selected.value] : [],
            selectedFloorValue: selected.value,
            selectedFloorLabel: selected.label,
            selectedHouseId: '',
            selectedRoomLabel: '',
            selectedHouseName: '',
            roomPickerOptions,
            roomPickerValue: [],
        });
    },
    openRoomPicker() {
        if (!this.data.roomPickerOptions.length) {
            return;
        }
        this.setData({
            roomPickerVisible: true,
            roomPickerValue: [this.data.selectedHouseId || this.data.roomPickerOptions[0].value],
        });
    },
    handleRoomPickerVisibleChange(event) {
        this.setData({ roomPickerVisible: !!event.detail.visible });
    },
    closeRoomPicker() {
        this.setData({ roomPickerVisible: false });
    },
    handleRoomConfirm(event) {
        const selected = getPickerResult(event);
        const selectedHouse = this.data.houseOptions.find((item) => item.id === selected.value);
        this.setData({
            roomPickerVisible: false,
            roomPickerValue: selected.value ? [selected.value] : [],
            selectedHouseId: selected.value,
            selectedRoomLabel: selected.label,
            selectedHouseName: selectedHouse?.displayName || selected.label,
        });
    },
    async handleSubmit() {
        const mobile = normalizeMobile(this.data.mobile);
        if (!isValidMobile(mobile)) {
            wx.showToast({
                title: '请输入正确的手机号',
                icon: 'none',
            });
            return;
        }
        if (!this.data.selectedBuildingId) {
            wx.showToast({
                title: '请选择楼栋',
                icon: 'none',
            });
            return;
        }
        if (!this.data.selectedFloorValue) {
            wx.showToast({
                title: '请选择楼层',
                icon: 'none',
            });
            return;
        }
        if (!this.data.selectedHouseId) {
            wx.showToast({
                title: '请选择房号',
                icon: 'none',
            });
            return;
        }
        const confirmed = await confirmSubmit(mobile, this.data.selectedHouseName);
        if (!confirmed) {
            return;
        }
        this.setData({ submitting: true });
        try {
            const code = await (0, auth_1.getWechatLoginCode)();
            const bindResult = await (0, auth_1.manualBindWechatPhone)({
                code,
                mobile,
            });
            app_1.appStore.setAccessToken(bindResult.accessToken);
            app_1.appStore.setSessionUser(bindResult.user);
            if (bindResult.matched) {
                wx.showModal({
                    title: '已完成绑定',
                    content: '已根据物业登记手机号为你完成房屋绑定，可直接进入“我的”查看。',
                    showCancel: false,
                    success: () => {
                        (0, nav_1.reLaunch)(routes_1.ROUTES.profile.index);
                    },
                });
                return;
            }
            await (0, auth_1.submitRegistrationRequest)({
                buildingId: this.data.selectedBuildingId,
                houseId: this.data.selectedHouseId,
            });
            wx.showModal({
                title: '申请已提交',
                content: '物业暂未匹配到该手机号的登记记录，已为你提交人工审核申请，请留意审核结果。',
                showCancel: false,
                success: () => {
                    (0, nav_1.reLaunch)(routes_1.ROUTES.profile.index);
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
            this.setData({ submitting: false });
        }
    },
    openPrivacy() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.legal.privacy);
    },
});
