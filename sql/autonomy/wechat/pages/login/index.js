"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const auth_1 = require("../../services/auth");
const app_1 = require("../../store/app");
const nav_1 = require("../../utils/nav");
function resolveErrorMessage(error) {
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
            const code = await (0, auth_1.getWechatLoginCode)();
            const result = await (0, auth_1.loginWithWechat)({ code });
            if (result.needRegister || !result.accessToken || !result.user) {
                app_1.appStore.clearSession();
                (0, nav_1.reLaunch)(routes_1.ROUTES.register);
                return;
            }
            app_1.appStore.setAccessToken(result.accessToken);
            app_1.appStore.setSessionUser(result.user);
            (0, nav_1.reLaunch)(routes_1.ROUTES.home);
        }
        catch (error) {
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
