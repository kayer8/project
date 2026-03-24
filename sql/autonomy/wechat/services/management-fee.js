"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchManagementFeeDisclosureTree = fetchManagementFeeDisclosureTree;
exports.formatManagementFeeDate = formatManagementFeeDate;
exports.formatManagementFeeDateTime = formatManagementFeeDateTime;
const request_1 = require("./request");
function fetchManagementFeeDisclosureTree(query = {}) {
    const search = buildSearch(query);
    return (0, request_1.request)({
        url: `/management-fees/disclosure-tree${search}`,
        method: 'GET',
        auth: false,
    });
}
function formatManagementFeeDate(value) {
    if (!value) {
        return '';
    }
    return value.slice(0, 10);
}
function formatManagementFeeDateTime(value) {
    if (!value) {
        return '';
    }
    return value.slice(0, 16).replace('T', ' ');
}
function buildSearch(query) {
    const pairs = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (!pairs.length) {
        return '';
    }
    return `?${pairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}`;
}
