"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
const list_1 = require("../../../utils/list");
Page({
    data: {
        allRecords: community_1.maintenanceRecords,
        records: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        pageSize: 10,
    },
    onLoad() {
        this.applyPagedList(true);
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
    applyPagedList(reset = true) {
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(this.data.allRecords, this.data.pageSize)
            : (0, list_1.getLocalListPage)(this.data.allRecords, this.data.records.length, this.data.pageSize);
        this.setData({
            records: reset ? result.items : [...this.data.records, ...result.items],
            finished: result.finished,
        });
    },
});
