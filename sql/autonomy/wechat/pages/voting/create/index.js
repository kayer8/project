"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nav_1 = require("../../../utils/nav");
const routes_1 = require("../../../constants/routes");
Page({
    data: {
        title: '',
        voteTypes: ['一户一票', '一人一票'],
        voteTypeIndex: 0,
        endDate: '',
        options: ['', ''],
    },
    handleTitleInput(event) {
        this.setData({ title: event.detail.value });
    },
    handleTypeChange(event) {
        this.setData({ voteTypeIndex: Number(event.detail.value || 0) });
    },
    handleDateChange(event) {
        this.setData({ endDate: String(event.detail.value || '') });
    },
    handleOptionInput(event) {
        const index = Number(event.currentTarget.dataset.index);
        const nextOptions = [...this.data.options];
        nextOptions[index] = event.detail.value;
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
