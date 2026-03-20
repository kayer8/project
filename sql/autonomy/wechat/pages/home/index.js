"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../mock/community");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        houses: community_1.houseOptions,
        currentHouseIndex: 0,
        currentHouse: community_1.houseOptions[0],
        showHousePopup: false,
        stats: community_1.workbenchStats,
        pinnedTools: community_1.workbenchPinnedTools,
        toolSections: community_1.workbenchSections,
    },
    openHousePopup() {
        this.setData({ showHousePopup: true });
    },
    handleHousePopupChange(event) {
        this.setData({ showHousePopup: !!event.detail?.visible });
    },
    handleSelectHouse(event) {
        const index = Number(event.currentTarget.dataset.index);
        if (Number.isNaN(index) || !community_1.houseOptions[index]) {
            return;
        }
        this.setData({
            currentHouseIndex: index,
            currentHouse: community_1.houseOptions[index],
            showHousePopup: false,
        });
    },
    handleNavigate(event) {
        const { url } = event.currentTarget.dataset;
        if (!url) {
            return;
        }
        (0, nav_1.navigateTo)(url);
    },
});
