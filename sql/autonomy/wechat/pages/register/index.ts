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
    buildingIndex: 0,
    houseIndex: 0,
    selectedBuildingId: '',
    selectedHouseId: '',
  },

  async handleGetPhoneNumber(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as {
      code?: string;
      errMsg?: string;
    };

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
            reLaunch(ROUTES.home);
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
      const selectedBuildingId = buildingOptions[0]?.id || '';

      this.setData({
        buildingOptions,
        buildingIndex: 0,
        selectedBuildingId,
        selectedHouseId: '',
        houseOptions: [],
        houseIndex: 0,
      });

      if (selectedBuildingId) {
        await this.loadHouseOptions(selectedBuildingId);
      }
    } finally {
      this.setData({ loadingOptions: false });
    }
  },

  async loadHouseOptions(buildingId: string) {
    const houseOptions = await listRegisterHouses(buildingId);

    this.setData({
      houseOptions,
      houseIndex: 0,
      selectedHouseId: houseOptions[0]?.id || '',
    });
  },

  async handleBuildingChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value || 0);
    const building = this.data.buildingOptions[index];

    this.setData({
      buildingIndex: index,
      selectedBuildingId: building?.id || '',
      selectedHouseId: '',
      houseOptions: [],
      houseIndex: 0,
    });

    if (building?.id) {
      await this.loadHouseOptions(building.id);
    }
  },

  handleHouseChange(event: WechatMiniprogram.PickerChange) {
    const index = Number(event.detail.value || 0);
    const house = this.data.houseOptions[index];

    this.setData({
      houseIndex: index,
      selectedHouseId: house?.id || '',
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
        reLaunch(ROUTES.home);
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
