import {
  fetchVoteDetail,
  formatVoteDeadline,
  formatVoteStatus,
  formatVoteType,
  submitVote,
  VoteItem,
} from '../../../services/vote';

interface VoteDetailView extends VoteItem {
  typeLabel: string;
  statusLabel: string;
  deadlineLabel: string;
}

function mapVoteDetail(item: VoteItem): VoteDetailView {
  return {
    ...item,
    typeLabel: formatVoteType(item.type),
    statusLabel: formatVoteStatus(item.status),
    deadlineLabel: formatVoteDeadline(item.deadline),
  };
}

Page({
  data: {
    vote: null as VoteDetailView | null,
    selectedOptionId: '',
    submitted: false,
    loading: true,
    submitting: false,
    errorMessage: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    if (!query.id) {
      this.setData({
        loading: false,
        errorMessage: '未找到对应投票',
      });
      return;
    }

    void this.loadVoteDetail(query.id);
  },

  async loadVoteDetail(id: string) {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const vote = await fetchVoteDetail(id);

      this.setData({
        vote: mapVoteDetail(vote),
        selectedOptionId: vote.selectedOptionId || '',
        submitted: vote.voted,
        loading: false,
      });
    } catch (error) {
      this.setData({
        vote: null,
        loading: false,
        errorMessage: error instanceof Error ? error.message : '投票详情加载失败',
      });
    }
  },

  handleSelectOption(event: WechatMiniprogram.BaseEvent) {
    const { optionId } = event.currentTarget.dataset as { optionId?: string };

    if (!optionId || this.data.submitted || !this.data.vote?.canVote) {
      return;
    }

    this.setData({ selectedOptionId: optionId });
  },

  async handleSubmitVote() {
    if (!this.data.vote || !this.data.selectedOptionId || this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });

    try {
      const vote = await submitVote(this.data.vote.id, this.data.selectedOptionId);

      wx.showToast({
        title: '投票已提交',
        icon: 'success',
      });

      this.setData({
        vote: mapVoteDetail(vote),
        submitted: true,
        selectedOptionId: vote.selectedOptionId || '',
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '投票提交失败',
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
