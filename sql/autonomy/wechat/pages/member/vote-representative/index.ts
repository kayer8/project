import { ROUTES } from '../../../constants/routes';
import { getHouseDetail } from '../../../services/mock';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    houseId: '',
    house: null as ReturnType<typeof getHouseDetail> | null,
    representativeOptions: [] as string[],
    representativeIndex: 0,
    scopeOptions: ['长期有效', '某次投票有效'],
    scopeIndex: 0,
    effectiveDate: '2026-03-18',
    expireDate: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      houseId: query.houseId || '',
    });
  },

  onShow() {
    const house = getHouseDetail(this.data.houseId || undefined);
    const representativeIndex = Math.max(
      house.members.findIndex((item) => item.isVoteRepresentative),
      0,
    );

    this.setData({
      houseId: house.id,
      house,
      representativeOptions: house.members
        .filter((item) => item.status === 'ACTIVE')
        .map((item) => `${item.userName} · ${item.relationLabel}`),
      representativeIndex,
    });
  },

  handleRepresentativeChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      representativeIndex: Number(event.detail.value),
    });
  },

  handleScopeChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      scopeIndex: Number(event.detail.value),
    });
  },

  handleDateChange(event: WechatMiniprogram.PickerChange) {
    const { field } = event.currentTarget.dataset as { field: string };
    this.setData({
      [field]: event.detail.value,
    } as Record<string, unknown>);
  },

  handleCancelAuthorization() {
    wx.showToast({ title: '已模拟取消授权', icon: 'success' });
  },

  handleSave() {
    wx.showToast({ title: '投票代表已更新', icon: 'success' });
    setTimeout(() => {
      redirectTo(ROUTES.house.detail, { id: this.data.houseId });
    }, 300);
  },
});
