"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        updates: community_1.announcements.filter((item) => item.category === '管理动态'),
    },
    openMaintenance() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.maintenance);
    },
    openDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
    },
});
