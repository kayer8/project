import { createVote, VoteType } from '../../../services/vote';
import { redirectTo } from '../../../utils/nav';
import { ROUTES } from '../../../constants/routes';

Page({
  data: {
    title: '',
    voteTypeOptions: [
      {
        label: '正式表决',
        value: 'FORMAL',
        content: '默认面向业主表决',
      },
      {
        label: '意见征集',
        value: 'CONSULTATION',
        content: '默认面向住户征集意见',
      },
    ],
    selectedVoteType: 'FORMAL' as VoteType,
    endDate: '',
    datePickerVisible: false,
    options: ['', ''],
    submitting: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    if (query.type === 'FORMAL' || query.type === 'CONSULTATION') {
      this.setData({
        selectedVoteType: query.type,
      });
    }
  },

  handleTitleInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ title: event.detail.value || '' });
  },

  handleTypeChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const value = event.detail.value;
    this.setData({
      selectedVoteType: value === 'CONSULTATION' ? 'CONSULTATION' : 'FORMAL',
    });
  },

  openDatePicker() {
    this.setData({ datePickerVisible: true });
  },

  handleDatePickerVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ datePickerVisible: !!event.detail.visible });
  },

  handleDateCancel() {
    this.setData({ datePickerVisible: false });
  },

  handleDateConfirm(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({
      endDate: event.detail.value || '',
      datePickerVisible: false,
    });
  },

  handleOptionInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const index = Number(event.currentTarget.dataset.index);
    const nextOptions = [...this.data.options];
    nextOptions[index] = event.detail.value || '';
    this.setData({ options: nextOptions });
  },

  addOption() {
    this.setData({ options: [...this.data.options, ''] });
  },

  async handleSubmit() {
    const normalizedOptions = this.data.options
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (!this.data.title.trim() || normalizedOptions.length < 2 || this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });

    try {
      const vote = await createVote({
        title: this.data.title.trim(),
        type: this.data.selectedVoteType,
        deadline: this.data.endDate || undefined,
        options: normalizedOptions.map((optionText) => ({ optionText })),
      });

      wx.showToast({
        title: '投票已发起',
        icon: 'success',
      });

      setTimeout(() => {
        redirectTo(ROUTES.voting.detail, { id: vote.id });
      }, 300);
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '投票发起失败',
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
