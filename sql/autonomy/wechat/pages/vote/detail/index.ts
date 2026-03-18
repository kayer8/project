import { ROUTES } from '../../../constants/routes';
import { getVoteDetail } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    vote: null as ReturnType<typeof getVoteDetail> | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id || '';
    this.setData({
      vote: getVoteDetail(id),
    });
  },

  handleJoinVote() {
    const vote = this.data.vote;
    if (!vote) {
      return;
    }
    openRoute(ROUTES.vote.join, { id: vote.id });
  },

  handleOpenResult() {
    const vote = this.data.vote;
    if (!vote) {
      return;
    }
    openRoute(ROUTES.vote.result, { id: vote.id });
  },

  handleShare() {
    wx.showToast({ title: '已模拟生成分享卡片', icon: 'none' });
  },
});
