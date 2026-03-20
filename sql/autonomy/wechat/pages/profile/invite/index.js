"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        phone: '',
        roles: ['家属', '租客', '共有人'],
        roleIndex: 0,
    },
    handlePhoneInput(event) {
        this.setData({ phone: event.detail.value });
    },
    handleRoleChange(event) {
        this.setData({ roleIndex: Number(event.detail.value || 0) });
    },
    handleSubmit() {
        if (this.data.phone.length < 11) {
            return;
        }
        wx.showToast({
            title: '邀请已发送',
            icon: 'success',
        });
        setTimeout(() => {
            (0, nav_1.redirectTo)(routes_1.ROUTES.profile.members);
        }, 300);
    },
});
