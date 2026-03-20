import { verificationRecord } from '../../../mock/community';

Page({
  data: {
    verification: verificationRecord,
    editing: false,
    realName: '',
    idNo: '',
    frontImage: '',
    backImage: '',
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
    const { field } = event.currentTarget.dataset as { field?: 'frontImage' | 'backImage' };

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
