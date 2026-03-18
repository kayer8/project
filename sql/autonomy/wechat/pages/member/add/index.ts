import { ROUTES } from '../../../constants/routes';
import { getHouseDetail } from '../../../services/mock';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    houseId: '',
    house: null as ReturnType<typeof getHouseDetail> | null,
    addMethodOptions: ['邀请加入', '手工登记后审核'],
    identityOptions: ['家庭成员', '同住成员', '代办人'],
    relationOptions: ['配偶', '子女', '父母', '亲属', '合租成员', '长期居住人', '委托代办'],
    addMethodIndex: 0,
    identityIndex: 0,
    relationIndex: 0,
    form: {
      name: '',
      mobile: '',
      startDate: '2026-03-18',
      endDate: '',
      canViewBill: true,
      canActAsAgent: false,
      canJoinConsultation: true,
    },
  },

  onLoad(query: Record<string, string | undefined>) {
    const houseId = query.houseId || '';
    this.setData({
      houseId,
      house: getHouseDetail(houseId || undefined),
    });
  },

  handleInput(event: WechatMiniprogram.Input) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [`form.${field}`]: event.detail.value,
    } as Record<string, unknown>);
  },

  handlePickerChange(event: WechatMiniprogram.PickerChange) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [field]: Number(event.detail.value),
    } as Record<string, unknown>);
  },

  handleDateChange(event: WechatMiniprogram.PickerChange) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [`form.${field}`]: event.detail.value,
    } as Record<string, unknown>);
  },

  handleSwitchChange(event: WechatMiniprogram.SwitchChange) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [`form.${field}`]: event.detail.value,
    } as Record<string, unknown>);
  },

  handleUploadMaterial() {
    wx.showToast({ title: '已模拟上传证明材料', icon: 'none' });
  },

  handleSubmit() {
    if (!this.data.form.name || !this.data.form.mobile) {
      wx.showToast({ title: '请填写成员姓名与手机号', icon: 'none' });
      return;
    }
    wx.showToast({ title: '成员申请已提交', icon: 'success' });
    setTimeout(() => {
      redirectTo(ROUTES.member.manage, { houseId: this.data.houseId });
    }, 300);
  },
});
