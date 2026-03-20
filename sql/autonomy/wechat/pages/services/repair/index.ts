import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

Page({
  data: {
    categories: ['水电维修', '电梯故障', '公共设施', '绿化环境', '卫生保洁', '其他'],
    selectedCategory: '水电维修',
    description: '',
    images: [] as string[],
  },

  handleCategorySelect(event: WechatMiniprogram.BaseEvent) {
    const { category } = event.currentTarget.dataset as { category?: string };

    if (!category) {
      return;
    }

    this.setData({ selectedCategory: category });
  },

  handleDescriptionInput(event: WechatMiniprogram.Input) {
    this.setData({ description: event.detail.value });
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
      redirectTo(ROUTES.home);
    }, 300);
  },
});
