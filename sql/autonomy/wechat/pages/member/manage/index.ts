import { ROUTES } from '../../../constants/routes';
import { getHouseDetail, getHouseMembers } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    houseId: '',
    house: null as ReturnType<typeof getHouseDetail> | null,
    members: getHouseMembers(),
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      houseId: query.houseId || '',
    });
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const house = getHouseDetail(this.data.houseId || undefined);
    this.setData({
      houseId: house.id,
      house,
      members: getHouseMembers(house.id),
    });
  },

  handleAddMember() {
    openRoute(ROUTES.member.add, { houseId: this.data.houseId });
  },

  handleOpenRepresentative() {
    openRoute(ROUTES.member.voteRepresentative, { houseId: this.data.houseId });
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.member.detail, { id });
  },

  handleRemoveMember(event: WechatMiniprogram.BaseEvent) {
    const { name } = event.currentTarget.dataset as { name: string };
    wx.showModal({
      title: '移除成员',
      content: `当前为页面演示，已模拟发起“移除 ${name}”申请。`,
      showCancel: false,
    });
  },
});
