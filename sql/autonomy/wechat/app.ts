import { appStore } from './store/app';

App<IAppOption>({
  onLaunch() {
    appStore.initialize();
  },
  globalData: {
    accessToken: '',
    sessionUser: null,
  },
});
