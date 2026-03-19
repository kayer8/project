"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./store/app");
App({
    onLaunch() {
        app_1.appStore.initialize();
    },
    globalData: {
        accessToken: '',
        sessionUser: null,
    },
});
