"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
Page({
    data: {
        verification: community_1.verificationRecord,
        editing: false,
        realName: '',
        idNo: '',
        frontImage: '',
        backImage: '',
    },
    openEdit() {
        this.setData({ editing: true });
    },
    handleNameInput(event) {
        this.setData({ realName: event.detail.value });
    },
    handleIdInput(event) {
        this.setData({ idNo: event.detail.value });
    },
    chooseImage(event) {
        const { field } = event.currentTarget.dataset;
        if (!field) {
            return;
        }
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            success: (res) => {
                const filePath = res.tempFilePaths[0] || '';
                this.setData({ [field]: filePath });
            },
        });
    },
    handleSubmit() {
        if (!this.data.realName || this.data.idNo.length < 18 || !this.data.frontImage || !this.data.backImage) {
            return;
        }
        wx.showToast({
            title: '认证已提交',
            icon: 'success',
        });
        this.setData({ editing: false });
    },
});
