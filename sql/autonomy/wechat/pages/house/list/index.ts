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

  handleViewDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.house.detail, { id });
  },

  handleSwitchCurrent(event: WechatMiniprogram.BaseEvent) {
    const { id, role } = event.currentTarget.dataset as { id: string; role: string };
    appStore.setCurrentHouseId(id);
    appStore.setCurrentRole(role);
    this.setData({ currentHouseId: id });
    wx.showToast({ title: '已切换当前房屋', icon: 'success' });
  },

  handleOpenSwitchPage() {
    openRoute(ROUTES.house.switch);
  },
});
