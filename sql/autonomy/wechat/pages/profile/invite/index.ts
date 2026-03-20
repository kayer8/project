import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

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

  handlePhoneInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ phone: event.detail.value || '' });
  },

  handleRoleChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
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
      redirectTo(ROUTES.profile.members);
    }, 300);
  },
});
