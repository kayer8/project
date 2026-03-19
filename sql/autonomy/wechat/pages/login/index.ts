import { ROUTES } from '../../constants/routes';
import { getWechatLoginCode, loginWithWechat } from '../../services/auth';
import { appStore } from '../../store/app';
import { reLaunch } from '../../utils/nav';

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '登录失败，请稍后重试';
}

Page({
  data: {
    checking: true,
    errorMessage: '',
  },

  onShow() {
    this.bootstrap();
  },

  async bootstrap() {
    this.setData({
      checking: true,
      errorMessage: '',
    });

    try {
      const code = await getWechatLoginCode();
      const result = await loginWithWechat({ code });

      if (result.needRegister || !result.accessToken || !result.user) {
        appStore.clearSession();
        reLaunch(ROUTES.register);
        return;
      }

      appStore.setAccessToken(result.accessToken);
      appStore.setSessionUser(result.user);
      reLaunch(ROUTES.home);
    } catch (error) {
      this.setData({
        checking: false,
        errorMessage: resolveErrorMessage(error),
      });
    }
  },

  handleRetry() {
    this.bootstrap();
  },
});
