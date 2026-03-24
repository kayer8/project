"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const disclosure_1 = require("../../../services/disclosure");
const list_1 = require("../../../utils/list");
const nav_1 = require("../../../utils/nav");
function mapItem(item) {
    return {
        ...item,
        displayDate: (0, disclosure_1.formatDisclosureDate)((0, disclosure_1.getDisclosureDisplayDate)(item)),
        preview: (0, disclosure_1.getDisclosurePreview)(item),
    };
}
Page({
    data: {
        allItems: [],
        items: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        errorMessage: '',
        pageSize: 10,
    },
    onLoad() {
        void this.loadContents();
    },
    async loadContents() {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const result = await (0, disclosure_1.fetchDisclosureContents)({
                category: '收费公开',
                page: 1,
                pageSize: 100,
            });
            this.setData({
                allItems: result.items.map(mapItem),
            });
            this.applyPagedList(true);
        }
        catch (error) {
            console.error('load payment disclosure contents failed', error);
            this.setData({
                allItems: [],
                items: [],
                errorMessage: error instanceof Error ? error.message : '收费公开加载失败',
                finished: true,
            });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    openDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
    },
    onPullDownRefresh() {
        void this.loadContents().finally(() => {
            wx.stopPullDownRefresh();
        });
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
            ? (0, list_1.getLocalListFirstPage)(this.data.allItems, this.data.pageSize)
            : (0, list_1.getLocalListPage)(this.data.allItems, this.data.items.length, this.data.pageSize);
        this.setData({
            items: reset ? result.items : [...this.data.items, ...result.items],
            finished: result.finished,
        });
    },
});
