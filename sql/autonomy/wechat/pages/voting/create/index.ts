import { redirectTo } from '../../../utils/nav';
import { ROUTES } from '../../../constants/routes';

Page({
  data: {
    title: '',
    voteTypes: ['一户一票', '一人一票'],
    voteTypeIndex: 0,
    endDate: '',
    options: ['', ''],
  },

  handleTitleInput(event: WechatMiniprogram.Input) {
    this.setData({ title: event.detail.value });
  },

  handleTypeChange(event: WechatMiniprogram.PickerChange) {
    this.setData({ voteTypeIndex: Number(event.detail.value || 0) });
  },

  handleDateChange(event: WechatMiniprogram.PickerChange) {
    this.setData({ endDate: String(event.detail.value || '') });
  },

  handleOptionInput(event: WechatMiniprogram.Input) {
    const index = Number(event.currentTarget.dataset.index);
    const nextOptions = [...this.data.options];
    nextOptions[index] = event.detail.value;
    this.setData({ options: nextOptions });
  },

  addOption() {
    this.setData({ options: [...this.data.options, ''] });
  },

  handleSubmit() {
    if (!this.data.title || !this.data.endDate) {
      return;
    }

    wx.showToast({
      title: '草稿已创建',
      icon: 'success',
    });

    setTimeout(() => {
      redirectTo(ROUTES.voting.index);
    }, 300);
  },
});
