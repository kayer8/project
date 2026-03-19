import { ROUTES } from '../../constants/routes';
import { fetchMyHouses, type MyHouseSummary } from '../../services/house';
import { fetchCurrentUser, type CurrentUserDetail } from '../../services/user';
import { appStore } from '../../store/app';
import { reLaunch } from '../../utils/nav';

function resolveStatusText(user: CurrentUserDetail) {
  if (user.residentStatus === 'SYNCED') {
    return '已同步';
  }

  if (user.residentStatus === 'UNVERIFIED') {
    return '未认证';
  }

  return '已注册';
}

Page({
  data: {
    loading: true,
    user: null as CurrentUserDetail | null,
    houses: [] as MyHouseSummary[],
    statusText: '',
    errorMessage: '',
  },

  onShow() {
    this.loadPage();
  },

  async loadPage() {
    if (!appStore.hasAccessToken()) {
      reLaunch(ROUTES.login);
      return;
    }

    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const user = await fetchCurrentUser();
      const houses = user.residentStatus === 'SYNCED' ? await fetchMyHouses() : [];

      this.setData({
        user,
        houses,
        statusText: resolveStatusText(user),
      });
    } catch (error) {
      appStore.clearSession();
      this.setData({
        errorMessage: error instanceof Error ? error.message : '加载失败，请重新登录',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleRelogin() {
    appStore.clearSession();
    reLaunch(ROUTES.login);
  },
});
