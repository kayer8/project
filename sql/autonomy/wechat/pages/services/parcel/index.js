"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../../../utils/list");
const mockParcels = [
    { title: '顺丰快件 SF1024', note: '已入库 · 物业前台' },
    { title: '京东快件 JD2048', note: '待领取 · 快递柜 3 号箱' },
];
Page({
    data: {
        allParcels: mockParcels,
        parcels: [],
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
        const listSource = source ?? this.data.allParcels;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.parcels.length, this.data.pageSize);
        this.setData({
            parcels: reset ? result.items : [...this.data.parcels, ...result.items],
            finished: result.finished,
        });
    },
});
