"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../mock/community");
Page({
    data: {
        user: community_1.currentUser,
        houses: community_1.profileHouses,
        members: community_1.members,
        verification: community_1.verificationRecord,
    },
});
