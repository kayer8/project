"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const session_1 = require("../../../services/session");
const user_1 = require("../../../services/user");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '状态获取失败，请稍后重试';
}
function resolveVerificationText(user) {
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
        virtualHost: true
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
        currentUser: null,
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
            const cachedUser = app_1.appStore.getSessionUser();
            this.setData({
                checking: true,
                errorMessage: '',
            });
            try {
                const hasSession = await (0, session_1.bootstrapWechatSession)();
                if (!hasSession || !app_1.appStore.hasAccessToken()) {
                    app_1.appStore.clearSession();
                    this.setData({
                        checking: false,
                        hasAccount: false,
                        sessionUser: null,
                        currentUser: null,
                        verificationText: '待提交',
                    });
                    return;
                }
                const currentUser = await (0, user_1.fetchCurrentUser)();
                const sessionUser = {
                    id: currentUser.id,
                    nickname: currentUser.nickname || '',
                    avatarUrl: currentUser.avatarUrl,
                    mobile: currentUser.mobile,
                    realName: currentUser.realName,
                };
                app_1.appStore.setSessionUser(sessionUser);
                this.setData({
                    checking: false,
                    hasAccount: true,
                    sessionUser,
                    currentUser,
                    verificationText: resolveVerificationText(currentUser),
                });
            }
            catch (error) {
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
            (0, nav_1.navigateTo)(routes_1.ROUTES.register);
        },
        handleRetry() {
            this.bootstrap();
        },
    },
});
