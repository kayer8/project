"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatKeyValue = formatKeyValue;
exports.buildQuery = buildQuery;
function formatKeyValue(items) {
    return items;
}
function buildQuery(params) {
    const query = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== '')
        .map((key) => `${key}=${encodeURIComponent(String(params[key]))}`)
        .join('&');
    return query ? `?${query}` : '';
}
