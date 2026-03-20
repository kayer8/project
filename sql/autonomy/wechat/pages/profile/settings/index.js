"use strict";
Page({
    data: {
        notifyBill: true,
        notifyAnnouncement: true,
        notifyVote: false,
    },
    handleSwitchChange(event) {
        const { field } = event.currentTarget.dataset;
        if (!field) {
            return;
        }
        this.setData({ [field]: !!event.detail?.value });
    },
});
