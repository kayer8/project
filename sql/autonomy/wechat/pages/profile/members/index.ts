import { ROUTES } from '../../../constants/routes';
import {
  CurrentHouseMemberItem,
  fetchCurrentHouseMembers,
  removeCurrentHouseMember,
} from '../../../services/member';
import { navigateTo } from '../../../utils/nav';

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '操作失败，请稍后重试';
}

function formatJoinDate(value: string) {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

Page({
  data: {
    houseId: '',
    houseName: '未绑定房屋',
    buildingName: '',
    canManageMembers: false,
    members: [] as Array<CurrentHouseMemberItem & { joinDateText: string }>,
    loading: true,
    errorMessage: '',
  },

  onLoad() {
    void this.loadMembers();
  },

  onPullDownRefresh() {
    void this.loadMembers().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  openInvite() {
    navigateTo(ROUTES.profile.invite);
  },

  openPermissions() {
    navigateTo(ROUTES.profile.permissions);
  },

  async loadMembers() {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const result = await fetchCurrentHouseMembers();
      this.setData({
        houseId: result.houseId || '',
        houseName: result.houseDisplayName || '未绑定房屋',
        buildingName: result.buildingName || '',
        canManageMembers: result.canManageMembers,
        members: result.items.map((item) => ({
          ...item,
          joinDateText: formatJoinDate(item.joinDate),
        })),
      });
    } catch (error) {
      this.setData({
        errorMessage: resolveErrorMessage(error),
        members: [],
      });
    } finally {
      this.setData({
        loading: false,
      });
    }
  },

  async handleRemove(event: WechatMiniprogram.BaseEvent) {
    const { id, name } = event.currentTarget.dataset as { id?: string; name?: string };

    if (!id) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: '移除成员',
        content: `确认将${name || '该成员'}移出当前房屋吗？`,
        confirmText: '确认移除',
        cancelText: '取消',
        success: (res) => resolve(res.confirm),
        fail: () => resolve(false),
      });
    });

    if (!confirmed) {
      return;
    }

    try {
      await removeCurrentHouseMember(id);
      wx.showToast({
        title: '成员已移除',
        icon: 'success',
      });
      await this.loadMembers();
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    }
  },
});
