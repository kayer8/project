"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
const app_1 = require("../store/app");
const env_1 = require("../utils/env");
function buildUrl(url) {
    if (/^https?:\/\//.test(url)) {
        return url;
    }
    return `${env_1.apiBaseUrl}${url}`;
}
function request(options) {
    return new Promise((resolve, reject) => {
        const token = app_1.appStore.getAccessToken();
        const headers = {
            'content-type': 'application/json',
            ...(options.header || {}),
        };
        if (options.auth !== false && token) {
            headers.Authorization = `Bearer ${token}`;
        }
        wx.request({
            ...options,
            url: buildUrl(options.url),
            header: headers,
            success: (res) => {
                const payload = res.data;
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    if (payload &&
                        typeof payload === 'object' &&
                        'code' in payload &&
                        'data' in payload) {
                        const wrapped = payload;
                        if (wrapped.code === 0) {
                            resolve(wrapped.data);
                            return;
                        }
                        if (wrapped.code === 'UNAUTHORIZED' || wrapped.code === 'INVALID_TOKEN') {
                            app_1.appStore.clearSession();
                        }
                        reject(new Error(wrapped.message || '请求失败'));
                        return;
                    }
                    resolve(payload);
                    return;
                }
                if (payload &&
                    typeof payload === 'object' &&
                    'message' in payload &&
                    typeof payload.message === 'string') {
                    reject(new Error(payload.message));
                    return;
                }
                reject(new Error(`请求失败(${res.statusCode})`));
            },
            fail: (error) => {
                reject(new Error(error.errMsg || '网络请求失败'));
            },
        });
    });
}
