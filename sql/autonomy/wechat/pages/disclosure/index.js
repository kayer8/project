"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const community_1 = require("../../mock/community");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        sections: community_1.disclosureSections,
        latestAnnouncements: community_1.announcements.slice(0, 3),
    },
    openDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.disclosure.detail, { id });
    },
});
