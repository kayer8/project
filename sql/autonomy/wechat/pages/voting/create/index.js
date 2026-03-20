"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nav_1 = require("../../../utils/nav");
const routes_1 = require("../../../constants/routes");
Page({
    data: {
        title: '',
        voteTypeOptions: [
            {
                label: '一户一票',
                value: 'house',
                content: '正式决策适用',
            },
            {
                label: '一人一票',
                value: 'person',
                content: '意见征集适用',
            },
        ],
        selectedVoteType: 'house',
        endDate: '',
        datePickerVisible: false,
        options: ['', ''],
    },
    handleTitleInput(event) {
        this.setData({ title: event.detail.value || '' });
    },
    handleTypeChange(event) {
        this.setData({ selectedVoteType: event.detail.value || 'house' });
    },
    openDatePicker() {
        this.setData({ datePickerVisible: true });
    },
    handleDatePickerVisibleChange(event) {
        this.setData({ datePickerVisible: !!event.detail.visible });
    },
    handleDateCancel() {
        this.setData({ datePickerVisible: false });
    },
    handleDateConfirm(event) {
        this.setData({
            endDate: event.detail.value || '',
            datePickerVisible: false,
        });
    },
    handleOptionInput(event) {
        const index = Number(event.currentTarget.dataset.index);
        const nextOptions = [...this.data.options];
        nextOptions[index] = event.detail.value || '';
        this.setData({ options: nextOptions });
    },
    addOption() {
        this.setData({ options: [...this.data.options, ''] });
    },
    handleSubmit() {
        if (!this.data.title || !this.data.endDate) {
            return;
        }
        wx.showToast({
            title: '草稿已创建',
            icon: 'success',
        });
        setTimeout(() => {
            (0, nav_1.redirectTo)(routes_1.ROUTES.voting.index);
        }, 300);
    },
});
