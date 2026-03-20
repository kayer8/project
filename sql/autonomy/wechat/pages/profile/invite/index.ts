import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    phone: '',
    roles: ['家属', '租客', '共有人'],
    roleIndex: 0,
  },

  handlePhoneInput(event: WechatMiniprogram.Input) {
    this.setData({ phone: event.detail.value });
  },

  handleRoleChange(event: WechatMiniprogram.PickerChange) {
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
      redirectTo(ROUTES.profile.members);
    }, 300);
  },
});
