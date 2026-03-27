"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCurrentHouseMembers = fetchCurrentHouseMembers;
exports.removeCurrentHouseMember = removeCurrentHouseMember;
const request_1 = require("./request");
function fetchCurrentHouseMembers() {
    return (0, request_1.request)({
        url: '/members/current-house',
        method: 'GET',
    });
}
function removeCurrentHouseMember(id) {
    return (0, request_1.request)({
        url: `/members/current-house/${id}`,
        method: 'DELETE',
    });
}
