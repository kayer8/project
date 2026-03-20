"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        categoryOptions: [
            { label: '水电维修', value: 'water-electric' },
            { label: '电梯故障', value: 'elevator' },
            { label: '公共设施', value: 'facility' },
            { label: '绿化环境', value: 'green' },
            { label: '卫生保洁', value: 'clean' },
            { label: '其他', value: 'other' },
        ],
        selectedCategory: 'water-electric',
        description: '',
        images: [],
    },
    handleCategoryChange(event) {
        this.setData({ selectedCategory: event.detail.value || 'water-electric' });
    },
    handleDescriptionInput(event) {
        this.setData({ description: event.detail.value || '' });
    },
    chooseImages() {
        wx.chooseImage({
            count: 3,
            sizeType: ['compressed'],
            success: (res) => {
                this.setData({ images: res.tempFilePaths });
            },
        });
    },
    handleSubmit() {
        if (!this.data.description) {
            return;
        }
        wx.showToast({
            title: '工单已提交',
            icon: 'success',
        });
        setTimeout(() => {
            (0, nav_1.redirectTo)(routes_1.ROUTES.disclosure.index);
        }, 300);
    },
});
