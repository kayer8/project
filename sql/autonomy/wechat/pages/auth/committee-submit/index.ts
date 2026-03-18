import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    form: {
      name: '',
      mobile: '',
      title: '',
      area: '',
      note: '',
      agreed: false,
    },
  },

  handleInput(event: WechatMiniprogram.Input) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [`form.${field}`]: event.detail.value,
    } as Record<string, unknown>);
  },

  handleAgreeChange(event: WechatMiniprogram.SwitchChange) {
    this.setData({
      'form.agreed': event.detail.value,
    });
  },

  handleUploadAppointment() {
    wx.showToast({ title: '已模拟上传任命证明', icon: 'none' });
  },

  handleUploadCommunityConfirm() {
    wx.showToast({ title: '已模拟上传社区确认材料', icon: 'none' });
  },

  handleSubmit() {
    const { form } = this.data;
    if (!form.name || !form.mobile || !form.title || !form.area) {
      wx.showToast({ title: '请完整填写委员会资料', icon: 'none' });
      return;
    }
    if (!form.agreed) {
      wx.showToast({ title: '请先同意协议', icon: 'none' });
      return;
    }
    wx.showToast({ title: '委员会认证已提交', icon: 'success' });
    setTimeout(() => {
      redirectTo(ROUTES.auth.result, { type: 'COMMITTEE' });
    }, 300);
  },
});
