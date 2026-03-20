"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const community_1 = require("../../../mock/community");
const nav_1 = require("../../../utils/nav");
Page({
    data: {
        members: [...community_1.members],
    },
    openInvite() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.invite);
    },
    openPermissions() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.profile.permissions);
    },
    handleRemove(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        this.setData({
            members: this.data.members.filter((item) => item.id !== id),
        });
    },
});
