import { ROUTES } from '../../../constants/routes';
import { bootstrapWechatSession } from '../../../services/session';
import { CurrentUserDetail, fetchCurrentUser } from '../../../services/user';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '状态获取失败，请稍后重试';
}

function resolveVerificationText(user: CurrentUserDetail | null) {
  if (user?.currentHouseProfile?.isVerified) {
    return '已通过';
  }

  if (user?.latestRegistrationRequest?.status === 'PENDING') {
    return '审核中';
  }

  if (user?.residentStatus === 'REJECTED') {
    return '未通过';
  }

  return '待提交';
}

Component({
  options: {
    addGlobalClass: true,
    virtualHost:true
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
    currentUser: null as CurrentUserDetail | null,
    verificationText: '待提交',
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
      const cachedUser = appStore.getSessionUser();

      this.setData({
        checking: true,
        errorMessage: '',
      });

      try {
        const hasSession = await bootstrapWechatSession();

        if (!hasSession || !appStore.hasAccessToken()) {
          appStore.clearSession();
          this.setData({
            checking: false,
            hasAccount: false,
            sessionUser: null,
            currentUser: null,
            verificationText: '待提交',
          });
          return;
        }

        const currentUser = await fetchCurrentUser();
        const sessionUser = {
          id: currentUser.id,
          nickname: currentUser.nickname || '',
          avatarUrl: currentUser.avatarUrl,
          mobile: currentUser.mobile,
          realName: currentUser.realName,
        };

        appStore.setSessionUser(sessionUser);

        this.setData({
          checking: false,
          hasAccount: true,
          sessionUser,
          currentUser,
          verificationText: resolveVerificationText(currentUser),
        });
      } catch (error) {
        const fallbackUser = cachedUser ?? null;

        this.setData({
          checking: false,
          hasAccount: Boolean(fallbackUser),
          sessionUser: fallbackUser,
          currentUser: null,
          verificationText: '待提交',
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
