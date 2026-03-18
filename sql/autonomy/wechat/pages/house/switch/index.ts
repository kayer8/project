import { ROUTES } from '../../../constants/routes';
import { getHouses } from '../../../services/mock';
import { appStore } from '../../../store/app';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    houses: getHouses(),
    currentHouseId: appStore.getCurrentHouseId(),
  },

  onShow() {
    this.setData({
      houses: getHouses(),
      currentHouseId: appStore.getCurrentHouseId(),
    });
  },

  handleSelect(event: WechatMiniprogram.BaseEvent) {
    const { id, role } = event.currentTarget.dataset as { id: string; role: string };
    appStore.setCurrentHouseId(id);
    appStore.setCurrentRole(role);
    this.setData({ currentHouseId: id });
    wx.showToast({ title: '上下文已切换', icon: 'success' });
    setTimeout(() => {
      openRoute(ROUTES.home);
    }, 300);
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.house.detail, { id });
  },
});
