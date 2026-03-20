"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const community_1 = require("../../mock/community");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        votes: community_1.votes,
    },
    openVoteDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.voting.detail, { id });
    },
    openCreateVote() {
        (0, nav_1.navigateTo)(routes_1.ROUTES.voting.create);
    },
});
