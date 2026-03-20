import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    categoryOptions: [
      { label: '水电维修', value: 'water-electric' },
      { label: '电梯故障', value: 'elevator' },
      { label: '公共设施', value: 'facility' },
      { label: '绿化环境', value: 'green' },
      { label: '卫生保洁', value: 'clean' },
      { label: '其他', value: 'other' },
    ],
    selectedCategory: 'water-electric',
    description: '',
    images: [] as string[],
  },

  handleCategoryChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ selectedCategory: event.detail.value || 'water-electric' });
  },

  handleDescriptionInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ description: event.detail.value || '' });
  },

  chooseImages() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({ images: res.tempFilePaths });
      },
    });
  },

  handleSubmit() {
    if (!this.data.description) {
      return;
    }

    wx.showToast({
      title: '工单已提交',
      icon: 'success',
    });

    setTimeout(() => {
      redirectTo(ROUTES.disclosure.index);
    }, 300);
  },
});
