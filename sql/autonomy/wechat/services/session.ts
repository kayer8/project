import { getWechatLoginCode, loginWithWechat } from './auth';
import { appStore } from '../store/app';

let bootstrapPromise: Promise<boolean> | null = null;

export function bootstrapWechatSession(force = false) {
  if (force) {
    bootstrapPromise = null;
  }

  if (appStore.hasAccessToken() && appStore.getSessionUser()) {
    return Promise.resolve(true);
  }

  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const code = await getWechatLoginCode();
      const result = await loginWithWechat({ code });

      if (result.needRegister || !result.accessToken || !result.user) {
        appStore.clearSession();
        return false;
      }

      appStore.setAccessToken(result.accessToken);
      appStore.setSessionUser(result.user);
      return true;
    } catch (error) {
      appStore.clearSession();
      throw error;
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}
