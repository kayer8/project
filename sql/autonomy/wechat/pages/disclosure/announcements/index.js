"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const nav_1 = require("../../../utils/nav");
function filterAnnouncements(keyword) {
    const normalized = keyword.trim();
    if (!normalized) {
        return community_1.announcements;
    }
    return community_1.announcements.filter((item) => item.title.includes(normalized) || item.category.includes(normalized) || item.content.includes(normalized));
}
Page({
    data: {
        keyword: '',
        announcements: community_1.announcements,
        filteredAnnouncements: community_1.announcements,
    },
    handleKeywordInput(event) {
        const keyword = event.detail.value;
        this.setData({
            keyword,
            filteredAnnouncements: filterAnnouncements(keyword),
        });
    },
    openDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
    },
});
