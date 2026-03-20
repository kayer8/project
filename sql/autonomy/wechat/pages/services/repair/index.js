"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        categories: ['水电维修', '电梯故障', '公共设施', '绿化环境', '卫生保洁', '其他'],
        selectedCategory: '水电维修',
        description: '',
        images: [],
    },
    handleCategorySelect(event) {
        const { category } = event.currentTarget.dataset;
        if (!category) {
            return;
        }
        this.setData({ selectedCategory: category });
    },
    handleDescriptionInput(event) {
        this.setData({ description: event.detail.value });
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
            (0, nav_1.redirectTo)(routes_1.ROUTES.home);
        }, 300);
    },
});
