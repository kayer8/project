"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
Page({
    data: {
        items: community_1.permissionItems.map((item) => ({ ...item })),
    },
    handleSwitchChange(event) {
        const { key } = event.currentTarget.dataset;
        if (!key) {
            return;
        }
        this.setData({
            items: this.data.items.map((item) => item.key === key
                ? {
                    ...item,
                    value: !!event.detail?.value,
                }
                : item),
        });
    },
});
