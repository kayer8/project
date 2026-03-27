"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMyVoteDetail = exports.fetchMyVotes = void 0;
exports.fetchVotes = fetchVotes;
exports.fetchVoteDetail = fetchVoteDetail;
exports.createVote = createVote;
exports.submitVote = submitVote;
exports.formatVoteType = formatVoteType;
exports.formatVoteStatus = formatVoteStatus;
exports.formatVoteDeadline = formatVoteDeadline;
const request_1 = require("./request");
function fetchVotes(query) {
    const search = buildSearch(query);
    return (0, request_1.request)({
        url: `/votes${search}`,
        method: 'GET',
        auth: false,
    });
}
function fetchMyVotes(query) {
    const search = buildSearch(query);
    return (0, request_1.request)({
        url: `/votes/mine${search}`,
        method: 'GET',
    });
}
exports.fetchMyVotes = fetchMyVotes;
function fetchVoteDetail(id) {
    return (0, request_1.request)({
        url: `/votes/${id}`,
        method: 'GET',
        auth: false,
    });
}
function fetchMyVoteDetail(id, houseId) {
    const search = buildSearch({ houseId });
    return (0, request_1.request)({
        url: `/votes/mine/${id}${search}`,
        method: 'GET',
    });
}
exports.fetchMyVoteDetail = fetchMyVoteDetail;
function createVote(payload) {
    return (0, request_1.request)({
        url: '/votes',
        method: 'POST',
        data: payload,
    });
}
function submitVote(id, optionId, houseId) {
    return (0, request_1.request)({
        url: `/votes/${id}/ballots`,
        method: 'POST',
        data: {
            optionId,
            ...(houseId ? { houseId } : {}),
        },
    });
}
function formatVoteType(type) {
    return type === 'FORMAL' ? '正式表决' : '意见征集';
}
function formatVoteStatus(status) {
    if (status === 'ONGOING') {
        return '进行中';
    }
    if (status === 'ENDED') {
        return '已结束';
    }
    return '草稿';
}
function formatVoteDeadline(value) {
    if (!value) {
        return '未设置';
    }
    return value.slice(0, 16).replace('T', ' ');
}
function buildSearch(query) {
    const pairs = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');
    if (!pairs.length) {
        return '';
    }
    return `?${pairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')}`;
}
