"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const list_1 = require("../../../utils/list");
const nav_1 = require("../../../utils/nav");
const communities = ['锦绣花园', '阳光水岸', '翡翠公馆', '金地名都', '万科城', '保利香槟'];
const buildingOptions = ['1栋', '2栋', '3栋', '8栋'].map((item) => ({ label: item, value: item }));
const unitOptions = ['1单元', '2单元'].map((item) => ({ label: item, value: item }));
function getPickerValue(event) {
    const values = Array.isArray(event.detail.value) ? event.detail.value : [];
    const labels = Array.isArray(event.detail.label) ? event.detail.label : [];
    return {
        value: values[0] || '',
        label: labels[0] || '',
    };
}
Page({
    data: {
        step: 1,
        keyword: '',
        allCommunities: communities,
        filteredCommunities: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        pageSize: 10,
        bindData: {
            community: '',
            building: '',
            unit: '',
            room: '',
            role: 'owner',
        },
        buildingOptions,
        unitOptions,
        roleOptions: [
            { label: '业主', value: 'owner' },
            { label: '家属', value: 'family' },
            { label: '租客', value: 'tenant' },
        ],
        buildingPickerVisible: false,
        unitPickerVisible: false,
        buildingPickerValue: [],
        unitPickerValue: [],
        proofImage: '',
    },
    onLoad() {
        this.applyCommunityList(true);
    },
    handleKeywordInput(event) {
        const keyword = (event.detail.value || '').trim();
        this.setData({ keyword });
        this.applyCommunityList(true);
    },
    handleSelectCommunity(event) {
        const { community } = event.currentTarget.dataset;
        if (!community) {
            return;
        }
        this.setData({
            step: 2,
            bindData: {
                ...this.data.bindData,
                community,
            },
        });
    },
    openBuildingPicker() {
        this.setData({
            buildingPickerVisible: true,
            buildingPickerValue: [this.data.bindData.building || this.data.buildingOptions[0]?.value || ''],
        });
    },
    handleBuildingPickerVisibleChange(event) {
        this.setData({ buildingPickerVisible: !!event.detail.visible });
    },
    closeBuildingPicker() {
        this.setData({ buildingPickerVisible: false });
    },
    handleBuildingConfirm(event) {
        const selected = getPickerValue(event);
        this.setData({
            buildingPickerVisible: false,
            buildingPickerValue: selected.value ? [selected.value] : [],
            bindData: {
                ...this.data.bindData,
                building: selected.label || selected.value,
            },
        });
    },
    openUnitPicker() {
        this.setData({
            unitPickerVisible: true,
            unitPickerValue: [this.data.bindData.unit || this.data.unitOptions[0]?.value || ''],
        });
    },
    handleUnitPickerVisibleChange(event) {
        this.setData({ unitPickerVisible: !!event.detail.visible });
    },
    closeUnitPicker() {
        this.setData({ unitPickerVisible: false });
    },
    handleUnitConfirm(event) {
        const selected = getPickerValue(event);
        this.setData({
            unitPickerVisible: false,
            unitPickerValue: selected.value ? [selected.value] : [],
            bindData: {
                ...this.data.bindData,
                unit: selected.label || selected.value,
            },
        });
    },
    handleRoomInput(event) {
        this.setData({
            bindData: {
                ...this.data.bindData,
                room: event.detail.value || '',
            },
        });
    },
    handleRoleChange(event) {
        this.setData({
            bindData: {
                ...this.data.bindData,
                role: event.detail.value || 'owner',
            },
        });
    },
    nextStep() {
        if (!this.data.bindData.building || !this.data.bindData.room) {
            return;
        }
        this.setData({ step: 3 });
    },
    chooseProof() {
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            success: (res) => {
                this.setData({ proofImage: res.tempFilePaths[0] || '' });
            },
        });
    },
    handleSubmit() {
        if (!this.data.proofImage) {
            return;
        }
        wx.showToast({
            title: '申请已提交',
            icon: 'success',
        });
        setTimeout(() => {
            (0, nav_1.redirectTo)(routes_1.ROUTES.profile.index);
        }, 300);
    },
    onListRefresh(event) {
        this.applyCommunityList(true);
        event?.detail?.done?.();
    },
    onListLoadMore() {
        if (this.data.finished || this.data.isLoadMore) {
            return;
        }
        this.setData({ isLoadMore: true });
        this.applyCommunityList(false);
        this.setData({ isLoadMore: false });
    },
    applyCommunityList(reset = true) {
        const source = this.data.allCommunities.filter((item) => item.includes(this.data.keyword));
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(source, this.data.pageSize)
            : (0, list_1.getLocalListPage)(source, this.data.filteredCommunities.length, this.data.pageSize);
        this.setData({
            filteredCommunities: reset
                ? result.items
                : [...this.data.filteredCommunities, ...result.items],
            finished: result.finished,
        });
    },
});
