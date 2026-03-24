import { CurrentUserDetail, fetchCurrentUser } from '../../../services/user';

type VerificationViewStatus = 'verified' | 'pending' | 'unverified';

function resolveVerificationStatus(user: CurrentUserDetail | null): VerificationViewStatus {
  if (user?.currentHouseProfile?.isVerified) {
    return 'verified';
  }

  if (user?.latestRegistrationRequest?.status === 'PENDING') {
    return 'pending';
  }

  return 'unverified';
}

function resolveStatusText(status: VerificationViewStatus) {
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
    currentUser: null as CurrentUserDetail | null,
    verificationStatus: 'unverified' as VerificationViewStatus,
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
      const currentUser = await fetchCurrentUser();
      const verificationStatus = resolveVerificationStatus(currentUser);

      this.setData({
        loading: false,
        currentUser,
        verificationStatus,
        statusText: resolveStatusText(verificationStatus),
        realName: currentUser.realName || '',
      });
    } catch (error) {
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

  handleNameInput(event: WechatMiniprogram.Input) {
    this.setData({ realName: event.detail.value });
  },

  handleIdInput(event: WechatMiniprogram.Input) {
    this.setData({ idNo: event.detail.value });
  },

  chooseImage(event: WechatMiniprogram.BaseEvent) {
    const { field } = event.currentTarget.dataset as {
      field?: 'frontImage' | 'backImage';
    };

    if (!field) {
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFilePaths[0] || '';
        this.setData({ [field]: filePath } as WechatMiniprogram.IAnyObject);
      },
    });
  },

  handleSubmit() {
    if (
      !this.data.realName ||
      this.data.idNo.length < 18 ||
      !this.data.frontImage ||
      !this.data.backImage
    ) {
      return;
    }

    wx.showToast({
      title: '认证资料已暂存',
      icon: 'success',
    });

    this.setData({ editing: false });
  },
});
