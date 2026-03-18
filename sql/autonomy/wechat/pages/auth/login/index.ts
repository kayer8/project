import { ROUTES } from '../../../constants/routes';
import {
  getWechatLoginCode,
  getWechatProfile,
  loginWithWechat,
  registerWithWechat,
  type WechatLoginResult,
  type WechatProfile,
} from '../../../services/auth';
import { hydrateSessionDashboard } from '../../../services/session';
import { appStore } from '../../../store/app';
import { switchTab } from '../../../utils/nav';

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '操作失败，请稍后重试';
}

Page({
  data: {
    step: 'login' as 'login' | 'register',
    submitting: false,
    mobile: '',
    profile: {
      nickname: '',
      avatarUrl: '',
    },
  },

  onShow() {
    if (appStore.hasAccessToken()) {
      switchTab(ROUTES.home);
      return;
    }

    const pendingProfile = appStore.getPendingRegisterProfile();
    if (pendingProfile) {
      this.setData({
        step: 'register',
        profile: pendingProfile,
      });
    }
  },

  handleInput(event: WechatMiniprogram.Input) {
    const { field } = event.currentTarget.dataset as { field: 'mobile' };
    this.setData({
      [field]: event.detail.value.trim(),
    } as Record<string, unknown>);
  },

  async handleWechatLogin() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });

    try {
      const profile = await getWechatProfile();
      const code = await getWechatLoginCode();
      const result = await loginWithWechat({
        code,
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
      });

      if (result.needRegister || !result.accessToken || !result.user) {
        appStore.setPendingRegisterProfile(profile);
        this.setData({
          step: 'register',
          profile,
        });
        wx.showToast({
          title: '首次使用，请补全手机号',
          icon: 'none',
        });
        return;
      }

      await this.finishLogin(result);
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async handleRegister() {
    if (this.data.submitting) {
      return;
    }

    if (!this.data.mobile) {
      wx.showToast({
        title: '请先填写手机号',
        icon: 'none',
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      const profile = this.data.profile as WechatProfile;
      const code = await getWechatLoginCode();
      const result = await registerWithWechat({
        code,
        nickname: profile.nickname || '微信用户',
        avatarUrl: profile.avatarUrl,
        mobile: this.data.mobile,
      });

      await this.finishLogin(result);
      appStore.setPendingRegisterProfile(null);
    } catch (error) {
      wx.showToast({
        title: resolveErrorMessage(error),
        icon: 'none',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  handleBackToLogin() {
    appStore.setPendingRegisterProfile(null);
    this.setData({
      step: 'login',
      mobile: '',
      profile: {
        nickname: '',
        avatarUrl: '',
      },
    });
  },

  async finishLogin(result: WechatLoginResult) {
    if (!result.accessToken || !result.user) {
      throw new Error('登录结果异常，请重新尝试');
    }

    appStore.setPendingRegisterProfile(null);
    appStore.setAccessToken(result.accessToken);
    appStore.setSessionUser(result.user);
    await hydrateSessionDashboard();

    wx.showToast({
      title: '登录成功',
      icon: 'success',
    });

    setTimeout(() => {
      switchTab(ROUTES.home);
    }, 300);
  },
});
