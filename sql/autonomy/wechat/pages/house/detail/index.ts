import { ROUTES } from '../../../constants/routes';
import { getHouseDetail } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    houseId: '',
    house: null as ReturnType<typeof getHouseDetail> | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    const houseId = query.id || '';
    this.setData({ houseId });
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const house = getHouseDetail(this.data.houseId || undefined);
    this.setData({
      houseId: house.id,
      house,
    });
  },

  handleOpenMembers() {
    openRoute(ROUTES.member.manage, { houseId: this.data.houseId });
  },

  handleOpenRepresentative() {
    openRoute(ROUTES.member.voteRepresentative, { houseId: this.data.houseId });
  },

  handleOpenAnnouncement(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.announcementDetail, { id });
  },

  handleOpenVote(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.vote.detail, { id });
  },
});
