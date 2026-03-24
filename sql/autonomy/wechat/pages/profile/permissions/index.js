"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
const list_1 = require("../../../utils/list");
Page({
    data: {
        allItems: community_1.permissionItems.map((item) => ({ ...item })),
        items: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        pageSize: 10,
    },
    onLoad() {
        this.applyPagedList(true);
    },
    handleSwitchChange(event) {
        const { key } = event.currentTarget.dataset;
        if (!key) {
            return;
        }
        const nextItems = this.data.allItems.map((item) => item.key === key
            ? {
                ...item,
                value: !!event.detail?.value,
            }
            : item);
        this.setData({ allItems: nextItems });
        this.applyPagedList(true, nextItems);
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
        const listSource = source ?? this.data.allItems;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.items.length, this.data.pageSize);
        this.setData({
            items: reset ? result.items : [...this.data.items, ...result.items],
            finished: result.finished,
        });
    },
});
