"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
Page({
    data: {
        item: null,
    },
    onLoad(query) {
        this.setData({
            item: community_1.announcements.find((announcement) => announcement.id === query.id) || null,
        });
    },
});
