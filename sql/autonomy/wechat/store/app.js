"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appStore = void 0;
const STORAGE_KEYS = {
    accessToken: 'autonomy_access_token',
    sessionUser: 'autonomy_session_user',
    selectedHouseId: 'autonomy_selected_house_id',
    registerDraft: 'autonomy_register_draft',
};
function syncGlobalData() {
    const app = getApp();
    if (!app?.globalData) {
        return;
    }
    app.globalData.accessToken = wx.getStorageSync(STORAGE_KEYS.accessToken) || '';
    app.globalData.sessionUser = wx.getStorageSync(STORAGE_KEYS.sessionUser) || null;
    app.globalData.selectedHouseId = wx.getStorageSync(STORAGE_KEYS.selectedHouseId) || '';
}
exports.appStore = {
    initialize() {
        syncGlobalData();
    },
    hasAccessToken() {
        return Boolean(wx.getStorageSync(STORAGE_KEYS.accessToken));
    },
    getAccessToken() {
        return wx.getStorageSync(STORAGE_KEYS.accessToken) || '';
    },
    setAccessToken(accessToken) {
        if (accessToken) {
            wx.setStorageSync(STORAGE_KEYS.accessToken, accessToken);
        }
        else {
            wx.removeStorageSync(STORAGE_KEYS.accessToken);
        }
        syncGlobalData();
    },
    getSessionUser() {
        return wx.getStorageSync(STORAGE_KEYS.sessionUser) || null;
    },
    setSessionUser(user) {
        if (user) {
            wx.setStorageSync(STORAGE_KEYS.sessionUser, user);
        }
        else {
            wx.removeStorageSync(STORAGE_KEYS.sessionUser);
        }
        syncGlobalData();
    },
    getSelectedHouseId() {
        return wx.getStorageSync(STORAGE_KEYS.selectedHouseId) || '';
    },
    setSelectedHouseId(houseId) {
        if (houseId) {
            wx.setStorageSync(STORAGE_KEYS.selectedHouseId, houseId);
        }
        else {
            wx.removeStorageSync(STORAGE_KEYS.selectedHouseId);
        }
        syncGlobalData();
    },
    getPendingRegisterProfile() {
        return wx.getStorageSync(STORAGE_KEYS.registerDraft) || null;
    },
    setPendingRegisterProfile(profile) {
        if (profile) {
            wx.setStorageSync(STORAGE_KEYS.registerDraft, profile);
        }
        else {
            wx.removeStorageSync(STORAGE_KEYS.registerDraft);
        }
    },
    clearSession() {
        wx.removeStorageSync(STORAGE_KEYS.accessToken);
        wx.removeStorageSync(STORAGE_KEYS.sessionUser);
        wx.removeStorageSync(STORAGE_KEYS.selectedHouseId);
        wx.removeStorageSync(STORAGE_KEYS.registerDraft);
        syncGlobalData();
    },
};
