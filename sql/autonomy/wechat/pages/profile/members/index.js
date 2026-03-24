"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const list_1 = require("../../../utils/list");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        allMembers: [...community_1.members],
        members: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        pageSize: 10,
    },
    onLoad() {
        this.applyPagedList(true);
    },
    openInvite() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.invite);
    },
    openPermissions() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.permissions);
    },
    handleRemove(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        const nextMembers = this.data.allMembers.filter((item) => item.id !== id);
        this.setData({ allMembers: nextMembers });
        this.applyPagedList(true, nextMembers);
    },
    onListRefresh(event) {
        this.applyPagedList(true);
        event?.detail?.done?.();
    },
    onListLoadMore() {
        if (this.data.finished || this.data.isLoadMore) {
            return;
        }
        this.setData({ isLoadMore: true });
        this.applyPagedList(false);
        this.setData({ isLoadMore: false });
    },
    applyPagedList(reset = true, source) {
        const listSource = source ?? this.data.allMembers;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.members.length, this.data.pageSize);
        this.setData({
            members: reset ? result.items : [...this.data.members, ...result.items],
            finished: result.finished,
        });
    },
});
