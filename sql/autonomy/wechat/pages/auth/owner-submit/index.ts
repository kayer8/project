import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    relationOptions: ['本人', '家属', '代理人'],
    relationIndex: 0,
    form: {
      name: '',
      mobile: '',
      idLast4: '',
      building: '',
      unit: '',
      room: '',
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

  handleRelationChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      relationIndex: Number(event.detail.value),
    });
  },

  handleAgreeChange(event: WechatMiniprogram.SwitchChange) {
    this.setData({
      'form.agreed': event.detail.value,
    });
  },

  handleUploadMaterial() {
    wx.showToast({ title: '已模拟上传证明材料', icon: 'none' });
  },

  handleSaveDraft() {
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  handleSubmit() {
    const { form, relationOptions, relationIndex } = this.data;
    if (!form.name || !form.mobile || !form.building || !form.unit || !form.room || !form.idLast4) {
      wx.showToast({ title: '请完整填写业主资料', icon: 'none' });
      return;
    }
    if (!form.agreed) {
      wx.showToast({ title: '请先同意隐私协议', icon: 'none' });
      return;
    }
    wx.showToast({ title: `已提交${relationOptions[relationIndex]}认证`, icon: 'success' });
    setTimeout(() => {
      redirectTo(ROUTES.auth.result, { type: 'OWNER' });
    }, 300);
  },
});
