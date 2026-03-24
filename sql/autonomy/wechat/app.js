"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./store/app");
const session_1 = require("./services/session");
App({
    onLaunch() {
        app_1.appStore.initialize();
        void (0, session_1.bootstrapWechatSession)().catch((error) => {
            console.warn('bootstrap wechat session failed', error);
        });
    },
    globalData: {
        accessToken: '',
        sessionUser: null,
    },
});
