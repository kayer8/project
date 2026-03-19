"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWechatLoginCode = getWechatLoginCode;
exports.loginWithWechat = loginWithWechat;
exports.syncWechatPhone = syncWechatPhone;
exports.listRegisterBuildings = listRegisterBuildings;
exports.listRegisterHouses = listRegisterHouses;
exports.submitRegistrationRequest = submitRegistrationRequest;
const request_1 = require("./request");
function getWechatLoginCode() {
    return new Promise((resolve, reject) => {
        wx.login({
            success: (res) => {
                if (res.code) {
                    resolve(res.code);
                    return;
                }
                reject(new Error('微信登录失败，请稍后重试'));
            },
            fail: (error) => reject(new Error(error.errMsg || '微信登录失败')),
        });
    });
}
function loginWithWechat(payload) {
    return (0, request_1.request)({
        url: '/auth/wechat_login',
        method: 'POST',
        data: payload,
        auth: false,
    });
}
function syncWechatPhone(payload) {
    return (0, request_1.request)({
        url: '/auth/wechat/phone-sync',
        method: 'POST',
        data: payload,
        auth: false,
    });
}
function listRegisterBuildings() {
    return (0, request_1.request)({
        url: '/auth/register/buildings',
        method: 'GET',
        auth: false,
    });
}
function listRegisterHouses(buildingId) {
    return (0, request_1.request)({
        url: `/auth/register/houses?buildingId=${encodeURIComponent(buildingId)}`,
        method: 'GET',
        auth: false,
    });
}
function submitRegistrationRequest(payload) {
    return (0, request_1.request)({
        url: '/auth/wechat/registration-request',
        method: 'POST',
        data: payload,
    });
}
