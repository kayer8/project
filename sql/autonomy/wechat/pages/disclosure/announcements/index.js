"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const disclosure_1 = require("../../../services/disclosure");
const list_1 = require("../../../utils/list");
const nav_1 = require("../../../utils/nav");
function filterAnnouncements(items, keyword) {
    const normalized = keyword.trim();
    if (!normalized) {
        return items;
    }
    return items.filter((item) => [item.title, item.category, item.publisher, item.summary || '', item.content].some((field) => field.includes(normalized)));
}
function mapAnnouncement(item) {
    return {
        ...item,
        displayDate: (0, disclosure_1.formatDisclosureDate)((0, disclosure_1.getDisclosureDisplayDate)(item)),
        preview: (0, disclosure_1.getDisclosurePreview)(item),
    };
}
Page({
    data: {
        keyword: '',
        allAnnouncements: [],
        filteredAnnouncements: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        errorMessage: '',
        pageSize: 10,
    },
    onLoad() {
        void this.loadAnnouncements();
    },
    async loadAnnouncements() {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const result = await (0, disclosure_1.fetchDisclosureContents)({
                category: '通知公告',
                page: 1,
                pageSize: 100,
            });
            const announcements = result.items.map(mapAnnouncement);
            this.setData({
                allAnnouncements: announcements,
            });
            this.applyAnnouncementList(true, announcements);
        }
        catch (error) {
            console.error('load disclosure announcements failed', error);
            this.setData({
                allAnnouncements: [],
                filteredAnnouncements: [],
                errorMessage: error instanceof Error ? error.message : '公开内容加载失败',
                finished: true,
            });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    handleKeywordInput(event) {
        const keyword = event.detail.value;
        this.setData({ keyword });
        this.applyAnnouncementList(true);
    },
    openDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
    },
    onPullDownRefresh() {
        void this.loadAnnouncements().finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    onListRefresh(event) {
        this.applyAnnouncementList(true);
        event?.detail?.done?.();
    },
    onListLoadMore() {
        if (this.data.finished || this.data.isLoadMore) {
            return;
        }
        this.setData({ isLoadMore: true });
        this.applyAnnouncementList(false);
        this.setData({ isLoadMore: false });
    },
    applyAnnouncementList(reset = true, source) {
        const listSource = source ?? this.data.allAnnouncements;
        const filtered = filterAnnouncements(listSource, this.data.keyword);
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(filtered, this.data.pageSize)
            : (0, list_1.getLocalListPage)(filtered, this.data.filteredAnnouncements.length, this.data.pageSize);
        this.setData({
            filteredAnnouncements: reset
                ? result.items
                : [...this.data.filteredAnnouncements, ...result.items],
            finished: result.finished,
        });
    },
});
