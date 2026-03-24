"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vote_1 = require("../../../services/vote");
function mapVoteDetail(item) {
    return {
        ...item,
        typeLabel: (0, vote_1.formatVoteType)(item.type),
        statusLabel: (0, vote_1.formatVoteStatus)(item.status),
        deadlineLabel: (0, vote_1.formatVoteDeadline)(item.deadline),
    };
}
Page({
    data: {
        vote: null,
        selectedOptionId: '',
        submitted: false,
        loading: true,
        submitting: false,
        errorMessage: '',
    },
    onLoad(query) {
        if (!query.id) {
            this.setData({
                loading: false,
                errorMessage: '未找到对应投票',
            });
            return;
        }
        void this.loadVoteDetail(query.id);
    },
    async loadVoteDetail(id) {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const vote = await (0, vote_1.fetchVoteDetail)(id);
            this.setData({
                vote: mapVoteDetail(vote),
                selectedOptionId: vote.selectedOptionId || '',
                submitted: vote.voted,
                loading: false,
            });
        }
        catch (error) {
            this.setData({
                vote: null,
                loading: false,
                errorMessage: error instanceof Error ? error.message : '投票详情加载失败',
            });
        }
    },
    handleSelectOption(event) {
        const { optionId } = event.currentTarget.dataset;
        if (!optionId || this.data.submitted || !this.data.vote?.canVote) {
            return;
        }
        this.setData({ selectedOptionId: optionId });
    },
    async handleSubmitVote() {
        if (!this.data.vote || !this.data.selectedOptionId || this.data.submitting) {
            return;
        }
        this.setData({ submitting: true });
        try {
            const vote = await (0, vote_1.submitVote)(this.data.vote.id, this.data.selectedOptionId);
            wx.showToast({
                title: '投票已提交',
                icon: 'success',
            });
            this.setData({
                vote: mapVoteDetail(vote),
                submitted: true,
                selectedOptionId: vote.selectedOptionId || '',
            });
        }
        catch (error) {
            wx.showToast({
                title: error instanceof Error ? error.message : '投票提交失败',
                icon: 'none',
            });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
});
