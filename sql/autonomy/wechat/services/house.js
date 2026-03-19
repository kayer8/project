"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMyHouses = fetchMyHouses;
const request_1 = require("./request");
function fetchMyHouses() {
    return (0, request_1.request)({
        url: '/houses/my',
        method: 'GET',
    });
}
