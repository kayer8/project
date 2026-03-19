"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCurrentUser = fetchCurrentUser;
const request_1 = require("./request");
function fetchCurrentUser() {
    return (0, request_1.request)({
        url: '/users/me',
        method: 'GET',
    });
}
