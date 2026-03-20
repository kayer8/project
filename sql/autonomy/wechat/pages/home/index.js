"use strict";
const TABS = ['disclosure', 'voting', 'profile'];
function isTabValue(value) {
    return !!value && TABS.includes(value);
}
Page({
    data: {
        activeTab: 'disclosure',
    },
    onLoad(query) {
        if (isTabValue(query.tab)) {
            this.setData({ activeTab: query.tab });
        }
    },
    handleTabChange(event) {
        const value = event.detail?.value;
        if (!isTabValue(value) || value === this.data.activeTab) {
            return;
        }
        this.setData({ activeTab: value });
    },
});
