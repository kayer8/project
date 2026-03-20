import { votes } from '../../../mock/community';

type VoteDetail = (typeof votes)[number];

Page({
  data: {
    vote: null as VoteDetail | null,
    selectedOption: -1,
    submitted: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const vote = votes.find((item) => item.id === query.id) || null;

    this.setData({
      vote,
      submitted: !!vote?.voted,
    });
  },

  handleSelectOption(event: WechatMiniprogram.BaseEvent) {
    const index = Number(event.currentTarget.dataset.index);

    if (Number.isNaN(index)) {
      return;
    }

    this.setData({ selectedOption: index });
  },

  handleSubmitVote() {
    if (this.data.selectedOption < 0) {
      return;
    }

    wx.showToast({
      title: '投票已提交',
      icon: 'success',
    });

    this.setData({ submitted: true });
  },
});
