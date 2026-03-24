"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = require("../../../utils/list");
const mockVisits = [
    { title: '新增访客预约', note: '登记来访人信息并生成二维码' },
    { title: '历史通行记录', note: '查看已预约访客与核验记录' },
];
Page({
    data: {
        allVisits: mockVisits,
        visits: [],
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
        const listSource = source ?? this.data.allVisits;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.visits.length, this.data.pageSize);
        this.setData({
            visits: reset ? result.items : [...this.data.visits, ...result.items],
            finished: result.finished,
        });
    },
});
