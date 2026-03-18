import { ROUTES } from '../../../constants/routes';
import { getVoteDetail } from '../../../services/mock';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    vote: null as ReturnType<typeof getVoteDetail> | null,
    selectedOptionId: '',
    opinion: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id || '';
    this.setData({
      vote: getVoteDetail(id),
    });
  },

  handleSelectOption(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    this.setData({
      selectedOptionId: id,
    });
  },

  handleOpinionInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      opinion: event.detail.value,
    });
  },

  handleSubmit() {
    if (!this.data.selectedOptionId) {
      wx.showToast({ title: '请选择一个投票选项', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认提交',
      content: '正式表决提交后不可修改，是否继续？',
      success: (res) => {
        if (!res.confirm || !this.data.vote) {
          return;
        }
        wx.showToast({ title: '投票已提交', icon: 'success' });
        setTimeout(() => {
          redirectTo(ROUTES.vote.result, { id: this.data.vote?.id });
        }, 300);
      },
    });
  },
});
