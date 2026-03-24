"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapWechatSession = bootstrapWechatSession;
const auth_1 = require("./auth");
const app_1 = require("../store/app");
let bootstrapPromise = null;
function bootstrapWechatSession(force = false) {
    if (force) {
        bootstrapPromise = null;
    }
    if (app_1.appStore.hasAccessToken() && app_1.appStore.getSessionUser()) {
        return Promise.resolve(true);
    }
    if (bootstrapPromise) {
        return bootstrapPromise;
    }
    bootstrapPromise = (async () => {
        try {
            const code = await (0, auth_1.getWechatLoginCode)();
            const result = await (0, auth_1.loginWithWechat)({ code });
            if (result.needRegister || !result.accessToken || !result.user) {
                app_1.appStore.clearSession();
                return false;
            }
            app_1.appStore.setAccessToken(result.accessToken);
            app_1.appStore.setSessionUser(result.user);
            return true;
        }
        catch (error) {
            app_1.appStore.clearSession();
            throw error;
        }
        finally {
            bootstrapPromise = null;
        }
    })();
    return bootstrapPromise;
}
