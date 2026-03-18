import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    form: {
      name: '',
      mobile: '',
      building: '',
      unit: '',
      room: '',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      ownerName: '',
      ownerMobile: '',
      residentCount: '',
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

  handleDateChange(event: WechatMiniprogram.PickerChange) {
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

  handleUploadMaterial() {
    wx.showToast({ title: '已模拟上传租赁资料', icon: 'none' });
  },

  handleSaveDraft() {
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  handleSubmit() {
    const { form } = this.data;
    if (!form.name || !form.mobile || !form.building || !form.unit || !form.room) {
      wx.showToast({ title: '请完整填写租户资料', icon: 'none' });
      return;
    }
    if (!form.agreed) {
      wx.showToast({ title: '请先同意协议', icon: 'none' });
      return;
    }
    wx.showToast({ title: '租户认证已提交', icon: 'success' });
    setTimeout(() => {
      redirectTo(ROUTES.auth.result, { type: 'TENANT' });
    }, 300);
  },
});
