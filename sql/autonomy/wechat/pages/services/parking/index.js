"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../../../utils/list");
const mockBills = [
    { title: '3 月停车月卡', note: '待缴费 · 260 元' },
    { title: '临时停车记录', note: '3 次进出 · 合计 46 元' },
];
Page({
    data: {
        allBills: mockBills,
        bills: [],
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
        const listSource = source ?? this.data.allBills;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.bills.length, this.data.pageSize);
        this.setData({
            bills: reset ? result.items : [...this.data.bills, ...result.items],
            finished: result.finished,
        });
    },
});
