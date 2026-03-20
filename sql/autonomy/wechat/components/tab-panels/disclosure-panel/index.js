"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const nav_1 = require("../../../utils/nav");
const sectionMetaMap = {
    公告通知: { icon: 'notification', tagTheme: 'primary' },
    财务公开: { icon: 'home', tagTheme: 'primary' },
    管理公开: { icon: 'setting', tagTheme: 'primary' },
    缴费情况: { icon: 'time', tagTheme: 'success' },
};
Component({
    options: {
        addGlobalClass: true,
    },
    data: {
        sections: community_1.disclosureSections.map((item) => ({
            ...item,
            icon: sectionMetaMap[item.title]?.icon || 'view-list',
            tagTheme: sectionMetaMap[item.title]?.tagTheme || 'primary',
        })),
        latestAnnouncements: community_1.announcements.slice(0, 3),
        latestUpdate: community_1.announcements[0]?.date || '',
        publishersLabel: '业委会 / 物业',
    },
    methods: {
        openDetail(event) {
            const { id } = event.currentTarget.dataset;
            if (!id) {
                return;
            }
            (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
        },
        openSection(event) {
            const { url } = event.currentTarget.dataset;
            if (!url) {
                return;
            }
            (0, nav_1.navigateTo)(url);
        },
    },
});
