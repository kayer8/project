import { appStore } from './store/app';
import { bootstrapWechatSession } from './services/session';

App<IAppOption>({
  onLaunch() {
    appStore.initialize();
    void bootstrapWechatSession().catch((error) => {
      console.warn('bootstrap wechat session failed', error);
    });
  },
  globalData: {
    accessToken: '',
    sessionUser: null,
  },
});
