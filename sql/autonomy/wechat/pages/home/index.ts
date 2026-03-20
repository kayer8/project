import { houseOptions, workbenchPinnedTools, workbenchSections, workbenchStats } from '../../mock/community';
import { navigateTo } from '../../utils/nav';

Page({
  data: {
    houses: houseOptions,
    currentHouseIndex: 0,
    currentHouse: houseOptions[0],
    showHousePopup: false,
    stats: workbenchStats,
    pinnedTools: workbenchPinnedTools,
    toolSections: workbenchSections,
  },

  openHousePopup() {
    this.setData({ showHousePopup: true });
  },

  handleHousePopupChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ showHousePopup: !!event.detail?.visible });
  },

  handleSelectHouse(event: WechatMiniprogram.BaseEvent) {
    const index = Number(event.currentTarget.dataset.index);

    if (Number.isNaN(index) || !houseOptions[index]) {
      return;
    }

    this.setData({
      currentHouseIndex: index,
      currentHouse: houseOptions[index],
      showHousePopup: false,
    });
  },

  handleNavigate(event: WechatMiniprogram.BaseEvent) {
    const { url } = event.currentTarget.dataset as { url?: string };

    if (!url) {
      return;
    }

    navigateTo(url);
  },
});
