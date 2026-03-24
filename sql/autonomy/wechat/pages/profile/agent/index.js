"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../../../utils/list");
const mockRecords = [
    { title: '父母代办物业缴费', status: '已授权', note: '有效期至 2024-12-31' },
    { title: '家属代办访客预约', status: '待确认', note: '等待对方确认加入' },
];
Page({
    data: {
        allRecords: mockRecords,
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
    applyPagedList(reset = true, source) {
        const listSource = source ?? this.data.allRecords;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.records.length, this.data.pageSize);
        this.setData({
            records: reset ? result.items : [...this.data.records, ...result.items],
            finished: result.finished,
        });
    },
});
