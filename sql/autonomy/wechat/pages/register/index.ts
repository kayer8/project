import { ROUTES } from '../../constants/routes';
import {
  getWechatLoginCode,
  listRegisterBuildings,
  listRegisterHouses,
  submitRegistrationRequest,
  syncWechatPhone,
  type RegisterBuildingOption,
  type RegisterHouseOption,
} from '../../services/auth';
import { appStore } from '../../store/app';
import { navigateTo, reLaunch } from '../../utils/nav';

type PickerOption = {
  label: string;
  value: string;
};

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '操作失败，请稍后重试';
}

function maskMobile(mobile?: string) {
  if (!mobile || mobile.length < 11) {
    return mobile || '';
  }

  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`;
}

function confirmSubmit(buildingName: string, houseName: string) {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title: '确认提交',
      content: `楼栋：${buildingName}\n房屋：${houseName || '暂未选择'}\n\n提交后将进入人工审核。`,
      confirmText: '确认提交',
      cancelText: '再看看',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
}

function getPickerResult(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
  const values = Array.isArray(event.detail.value) ? event.detail.value : [];
  const labels = Array.isArray(event.detail.label) ? event.detail.label : [];

  return {
    value: values[0] || '',
    label: labels[0] || '',
  };
}

Page({
  data: {
    phase: 'phone' as 'phone' | 'form',
    submitting: false,
    loadingOptions: false,
    mobile: '',
    mobileMasked: '',
    syncMessage: '',
    buildingOptions: [] as RegisterBuildingOption[],
    houseOptions: [] as RegisterHouseOption[],
    buildingPickerOptions: [] as PickerOption[],
    housePickerOptions: [] as PickerOption[],
    buildingPickerVisible: false,
    housePickerVisible: false,
    buildingPickerValue: [] as string[],
    housePickerValue: [] as string[],
    selectedBuildingId: '',
    selectedBuildingName: '',
    selectedHouseId: '',
    selectedHouseName: '',
  },

  async handleGetPhoneNumber(event: WechatMiniprogram.CustomEvent<{ code?: string; errMsg?: string }>) {
    const detail = event.detail;

    if (!detail.code || detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({
        title: '未获取到手机号授权',
        icon: 'none',
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      const code = await getWechatLoginCode();
      const result = await syncWechatPhone({
        code,
        phoneCode: detail.code,
      });

      appStore.setAccessToken(result.accessToken);
      appStore.setSessionUser(result.user);

      if (result.matched) {
        wx.showModal({
          title: '同步成功',
          content: result.message,
          showCancel: false,
          success: () => {
            reLaunch(ROUTES.profile.index);
          },
        });
        return;
      }

      this.setData({
        phase: 'form',
        mobile: result.mobile || result.user.mobile || '',
        mobileMasked: maskMobile(result.mobile || result.user.mobile || ''),
        syncMessage: result.message,
      });

      await this.loadBuildingOptions();
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async loadBuildingOptions() {
    this.setData({ loadingOptions: true });

    try {
      const buildingOptions = await listRegisterBuildings();
      const buildingPickerOptions = buildingOptions.map((item) => ({
        label: item.buildingName,
        value: item.id,
      }));

      this.setData({
        buildingOptions,
        buildingPickerOptions,
        buildingPickerValue: [],
        selectedBuildingId: '',
        selectedBuildingName: '',
        selectedHouseId: '',
        selectedHouseName: '',
        houseOptions: [],
        housePickerOptions: [],
        housePickerValue: [],
      });

      if (!buildingOptions.length) {
        wx.showToast({
          title: '暂无可选楼栋，请联系管理员',
          icon: 'none',
        });
      }
    } finally {
      this.setData({ loadingOptions: false });
    }
  },

  async loadHouseOptions(buildingId: string) {
    const houseOptions = await listRegisterHouses(buildingId);
    const housePickerOptions = houseOptions.map((item) => ({
      label: item.displayName,
      value: item.id,
    }));

    this.setData({
      houseOptions,
      housePickerOptions,
      housePickerValue: [],
      selectedHouseId: '',
      selectedHouseName: '',
    });
  },

  openBuildingPicker() {
    if (!this.data.buildingPickerOptions.length) {
      return;
    }

    this.setData({
      buildingPickerVisible: true,
      buildingPickerValue: [this.data.selectedBuildingId || this.data.buildingPickerOptions[0].value],
    });
  },

  handleBuildingPickerVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ buildingPickerVisible: !!event.detail.visible });
  },

  closeBuildingPicker() {
    this.setData({ buildingPickerVisible: false });
  },

  async handleBuildingConfirm(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
    const selected = getPickerResult(event);

    this.setData({
      buildingPickerVisible: false,
      buildingPickerValue: selected.value ? [selected.value] : [],
      selectedBuildingId: selected.value,
      selectedBuildingName: selected.label,
      selectedHouseId: '',
      selectedHouseName: '',
      houseOptions: [],
      housePickerOptions: [],
      housePickerValue: [],
    });

    if (!selected.value) {
      return;
    }

    try {
      await this.loadHouseOptions(selected.value);
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    }
  },

  openHousePicker() {
    if (!this.data.housePickerOptions.length) {
      return;
    }

    this.setData({
      housePickerVisible: true,
      housePickerValue: [this.data.selectedHouseId || this.data.housePickerOptions[0].value],
    });
  },

  handleHousePickerVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ housePickerVisible: !!event.detail.visible });
  },

  closeHousePicker() {
    this.setData({ housePickerVisible: false });
  },

  handleHouseConfirm(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
    const selected = getPickerResult(event);

    this.setData({
      housePickerVisible: false,
      housePickerValue: selected.value ? [selected.value] : [],
      selectedHouseId: selected.value,
      selectedHouseName: selected.label,
    });
  },

  async handleSubmitRequest() {
    if (!this.data.selectedBuildingId) {
      wx.showToast({
        title: '请先选择楼栋',
        icon: 'none',
      });
      return;
    }

    const confirmed = await confirmSubmit(
      this.data.selectedBuildingName || '未选择楼栋',
      this.data.selectedHouseName,
    );

    if (!confirmed) {
      return;
    }

    this.setData({ submitting: true });

    try {
      await submitRegistrationRequest({
        buildingId: this.data.selectedBuildingId,
        houseId: this.data.selectedHouseId || undefined,
      });

      wx.showToast({
        title: '提交成功',
        icon: 'success',
      });

      setTimeout(() => {
        reLaunch(ROUTES.profile.index);
      }, 300);
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  openPrivacy() {
    navigateTo(ROUTES.legal.privacy);
  },
});
