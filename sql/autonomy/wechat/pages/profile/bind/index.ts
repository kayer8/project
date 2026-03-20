import { ROUTES } from '../../../constants/routes';
import { redirectTo } from '../../../utils/nav';

const communities = ['锦绣花园', '阳光水岸', '翡翠公馆', '金地名都', '万科城', '保利香槟'];

Page({
  data: {
    step: 1,
    keyword: '',
    communities,
    filteredCommunities: communities,
    bindData: {
      community: '',
      building: '',
      unit: '',
      room: '',
      role: '业主',
    },
    buildingOptions: ['1号楼', '2号楼', '3号楼', '8号楼'],
    unitOptions: ['1单元', '2单元'],
    buildingIndex: 0,
    unitIndex: 0,
    proofImage: '',
  },

  handleKeywordInput(event: WechatMiniprogram.Input) {
    const keyword = event.detail.value.trim();

    this.setData({
      keyword,
      filteredCommunities: communities.filter((item) => item.includes(keyword)),
    });
  },

  handleSelectCommunity(event: WechatMiniprogram.BaseEvent) {
    const { community } = event.currentTarget.dataset as { community?: string };

    if (!community) {
      return;
    }

    this.setData({
      step: 2,
      bindData: {
        ...this.data.bindData,
        community,
      },
    });
  },

  handleBuildingChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value || 0);

    this.setData({
      buildingIndex: index,
      bindData: {
        ...this.data.bindData,
        building: this.data.buildingOptions[index] || '',
      },
    });
  },

  handleUnitChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value || 0);

    this.setData({
      unitIndex: index,
      bindData: {
        ...this.data.bindData,
        unit: this.data.unitOptions[index] || '',
      },
    });
  },

  handleRoomInput(event: WechatMiniprogram.Input) {
    this.setData({
      bindData: {
        ...this.data.bindData,
        room: event.detail.value,
      },
    });
  },

  handleRoleSelect(event: WechatMiniprogram.BaseEvent) {
    const { role } = event.currentTarget.dataset as { role?: string };

    if (!role) {
      return;
    }

    this.setData({
      bindData: {
        ...this.data.bindData,
        role,
      },
    });
  },

  nextStep() {
    if (!this.data.bindData.building || !this.data.bindData.room) {
      return;
    }

    this.setData({ step: 3 });
  },

  chooseProof() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({ proofImage: res.tempFilePaths[0] || '' });
      },
    });
  },

  handleSubmit() {
    if (!this.data.proofImage) {
      return;
    }

    wx.showToast({
      title: '申请已提交',
      icon: 'success',
    });

    setTimeout(() => {
      redirectTo(ROUTES.profile.index);
    }, 300);
  },
});
