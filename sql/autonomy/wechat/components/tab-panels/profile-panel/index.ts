import { ROUTES } from '../../../constants/routes';
import { verificationRecord } from '../../../mock/community';
import { loginWithWechat, getWechatLoginCode } from '../../../services/auth';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '状态获取失败，请稍后重试';
}

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    active: {
      type: Boolean,
      value: false,
      observer(active: boolean) {
        if (active) {
          this.bootstrap();
        }
      },
    },
  },

  data: {
    checking: true,
    hasAccount: false,
    errorMessage: '',
    sessionUser: null as ReturnType<typeof appStore.getSessionUser>,
    verification: verificationRecord,
  },

  lifetimes: {
    attached() {
      if (this.data.active) {
        this.bootstrap();
      }
    },
  },

  methods: {
    async bootstrap() {
      this.setData({
        checking: true,
        errorMessage: '',
      });

      try {
        const cachedUser = appStore.getSessionUser();

        if (appStore.hasAccessToken() && cachedUser) {
          this.setData({
            checking: false,
            hasAccount: true,
            sessionUser: cachedUser,
          });
          return;
        }

        const code = await getWechatLoginCode();
        const result = await loginWithWechat({ code });

        if (result.needRegister || !result.accessToken || !result.user) {
          appStore.clearSession();
          this.setData({
            checking: false,
            hasAccount: false,
            sessionUser: null,
          });
          return;
        }

        appStore.setAccessToken(result.accessToken);
        appStore.setSessionUser(result.user);

        this.setData({
          checking: false,
          hasAccount: true,
          sessionUser: result.user,
        });
      } catch (error) {
        appStore.clearSession();
        this.setData({
          checking: false,
          hasAccount: false,
          sessionUser: null,
          errorMessage: resolveErrorMessage(error),
        });
      }
    },

    goBindHouse() {
      navigateTo(ROUTES.register);
    },

    handleRetry() {
      this.bootstrap();
    },
  },
});
