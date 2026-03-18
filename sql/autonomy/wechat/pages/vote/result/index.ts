import { getVoteDetail } from '../../../services/mock';

Page({
  data: {
    vote: null as ReturnType<typeof getVoteDetail> | null,
    totalVotes: 0,
  },

  onLoad(query: Record<string, string | undefined>) {
    const vote = getVoteDetail(query.id || '');
    this.setData({
      vote,
      totalVotes: vote.options.reduce((sum, item) => sum + item.count, 0),
    });
  },
});
