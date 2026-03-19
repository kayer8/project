"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigateTo = navigateTo;
exports.redirectTo = redirectTo;
exports.reLaunch = reLaunch;
function buildQuery(params) {
    const query = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
    return query ? `?${query}` : '';
}
function navigateTo(url, params) {
    wx.navigateTo({ url: `${url}${buildQuery(params || {})}` });
}
function redirectTo(url, params) {
    wx.redirectTo({ url: `${url}${buildQuery(params || {})}` });
}
function reLaunch(url, params) {
    wx.reLaunch({ url: `${url}${buildQuery(params || {})}` });
}
