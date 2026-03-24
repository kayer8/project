"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../../../services/user");
function resolveVerificationStatus(user) {
    if (user?.currentHouseProfile?.isVerified) {
        return 'verified';
    }
    if (user?.latestRegistrationRequest?.status === 'PENDING') {
        return 'pending';
    }
    return 'unverified';
}
function resolveStatusText(status) {
    if (status === 'verified') {
        return '已通过';
    }
    if (status === 'pending') {
        return '审核中';
    }
    return '待提交';
}
Page({
    data: {
        loading: true,
        errorMessage: '',
        currentUser: null,
        verificationStatus: 'unverified',
        statusText: '待提交',
        editing: false,
        realName: '',
        idNo: '',
        frontImage: '',
        backImage: '',
    },
    onShow() {
        void this.loadCurrentUser();
    },
    async loadCurrentUser() {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const currentUser = await (0, user_1.fetchCurrentUser)();
            const verificationStatus = resolveVerificationStatus(currentUser);
            this.setData({
                loading: false,
                currentUser,
                verificationStatus,
                statusText: resolveStatusText(verificationStatus),
                realName: currentUser.realName || '',
            });
        }
        catch (error) {
            this.setData({
                loading: false,
                currentUser: null,
                verificationStatus: 'unverified',
                statusText: '待提交',
                errorMessage: error instanceof Error ? error.message : '个人信息加载失败',
            });
        }
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
        if (!this.data.realName ||
            this.data.idNo.length < 18 ||
            !this.data.frontImage ||
            !this.data.backImage) {
            return;
        }
        wx.showToast({
            title: '认证资料已暂存',
            icon: 'success',
        });
        this.setData({ editing: false });
    },
});
