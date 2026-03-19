"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const house_1 = require("../../services/house");
const user_1 = require("../../services/user");
const app_1 = require("../../store/app");
const nav_1 = require("../../utils/nav");
function resolveStatusText(user) {
    if (user.residentStatus === 'SYNCED') {
        return '已同步';
    }
    if (user.residentStatus === 'UNVERIFIED') {
        return '未认证';
    }
    return '已注册';
}
Page({
    data: {
        loading: true,
        user: null,
        houses: [],
        statusText: '',
        errorMessage: '',
    },
    onShow() {
        this.loadPage();
    },
    async loadPage() {
        if (!app_1.appStore.hasAccessToken()) {
            (0, nav_1.reLaunch)(routes_1.ROUTES.login);
            return;
        }
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const user = await (0, user_1.fetchCurrentUser)();
            const houses = user.residentStatus === 'SYNCED' ? await (0, house_1.fetchMyHouses)() : [];
            this.setData({
                user,
                houses,
                statusText: resolveStatusText(user),
            });
        }
        catch (error) {
            app_1.appStore.clearSession();
            this.setData({
                errorMessage: error instanceof Error ? error.message : '加载失败，请重新登录',
            });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    handleRelogin() {
        app_1.appStore.clearSession();
        (0, nav_1.reLaunch)(routes_1.ROUTES.login);
    },
});
