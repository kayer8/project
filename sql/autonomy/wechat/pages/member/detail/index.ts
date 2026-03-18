import { ROUTES } from '../../../constants/routes';
import { getMemberDetail } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    detail: null as ReturnType<typeof getMemberDetail>,
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id || '';
    this.setData({
      detail: getMemberDetail(id),
    });
  },

  handleOpenRepresentative() {
    const detail = this.data.detail;
    if (!detail) {
      return;
    }
    openRoute(ROUTES.member.voteRepresentative, { houseId: detail.house.id });
  },

  handleExtend() {
    wx.showToast({ title: '已模拟延长有效期', icon: 'success' });
  },

  handleRemove() {
    wx.showModal({
      title: '移除成员',
      content: '当前为演示页面，已模拟发起移除流程。',
      showCancel: false,
    });
  },
});
