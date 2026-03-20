"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
Page({
    data: {
        vote: null,
        selectedOption: -1,
        submitted: false,
    },
    onLoad(query) {
        const vote = community_1.votes.find((item) => item.id === query.id) || null;
        this.setData({
            vote,
            submitted: !!vote?.voted,
        });
    },
    handleSelectOption(event) {
        const index = Number(event.currentTarget.dataset.index);
        if (Number.isNaN(index)) {
            return;
        }
        this.setData({ selectedOption: index });
    },
    handleSubmitVote() {
        if (this.data.selectedOption < 0) {
            return;
        }
        wx.showToast({
            title: '投票已提交',
            icon: 'success',
        });
        this.setData({ submitted: true });
    },
});
