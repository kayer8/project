"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const auth_1 = require("../../../services/auth");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
function resolveErrorMessage(error) {
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
            observer(active) {
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
        sessionUser: null,
        verification: community_1.verificationRecord,
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
                const cachedUser = app_1.appStore.getSessionUser();
                if (app_1.appStore.hasAccessToken() && cachedUser) {
                    this.setData({
                        checking: false,
                        hasAccount: true,
                        sessionUser: cachedUser,
                    });
                    return;
                }
                const code = await (0, auth_1.getWechatLoginCode)();
                const result = await (0, auth_1.loginWithWechat)({ code });
                if (result.needRegister || !result.accessToken || !result.user) {
                    app_1.appStore.clearSession();
                    this.setData({
                        checking: false,
                        hasAccount: false,
                        sessionUser: null,
                    });
                    return;
                }
                app_1.appStore.setAccessToken(result.accessToken);
                app_1.appStore.setSessionUser(result.user);
                this.setData({
                    checking: false,
                    hasAccount: true,
                    sessionUser: result.user,
                });
            }
            catch (error) {
                app_1.appStore.clearSession();
                this.setData({
                    checking: false,
                    hasAccount: false,
                    sessionUser: null,
                    errorMessage: resolveErrorMessage(error),
                });
            }
        },
        goBindHouse() {
            (0, nav_1.navigateTo)(routes_1.ROUTES.register);
        },
        handleRetry() {
            this.bootstrap();
        },
    },
});
