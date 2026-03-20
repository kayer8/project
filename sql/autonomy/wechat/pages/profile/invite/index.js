"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        phone: '',
        roleOptions: [
            { label: '家属', value: 'family' },
            { label: '租客', value: 'tenant' },
            { label: '共有人', value: 'coOwner' },
        ],
        selectedRole: 'family',
    },
    handlePhoneInput(event) {
        this.setData({ phone: event.detail.value || '' });
    },
    handleRoleChange(event) {
        this.setData({ selectedRole: event.detail.value || 'family' });
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
