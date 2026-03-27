"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const session_1 = require("../../../services/session");
const vote_1 = require("../../../services/vote");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
function mapVoteRecord(item) {
    const selectedOption = item.options.find((option) => option.id === item.selectedOptionId);
    return {
        ...item,
        typeLabel: (0, vote_1.formatVoteType)(item.type),
        statusLabel: (0, vote_1.formatVoteStatus)(item.status),
        deadlineLabel: (0, vote_1.formatVoteDeadline)(item.deadline),
        selectedOptionText: selectedOption?.optionText || '未找到已投选项',
    };
}
function resolveErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return '投票记录加载失败';
}
Page({
    data: {
        votes: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        errorMessage: '',
        page: 1,
        pageSize: 10,
    },
    onLoad() {
        void this.loadVotes(true);
    },
    async loadVotes(reset = false) {
        const nextPage = reset ? 1 : this.data.page + 1;
        this.setData({
            loading: reset,
            isLoadMore: !reset,
            errorMessage: '',
        });
        try {
            const hasSession = await (0, session_1.bootstrapWechatSession)();
            if (!hasSession || !app_1.appStore.hasAccessToken()) {
                this.setData({
                    votes: [],
                    page: 1,
                    finished: true,
                    errorMessage: '请先登录后查看投票记录',
                });
                return;
            }
            const result = await (0, vote_1.fetchMyVotes)({
                page: nextPage,
                pageSize: this.data.pageSize,
                houseId: app_1.appStore.getSelectedHouseId() || undefined,
            });
            const nextItems = result.items.map(mapVoteRecord);
            this.setData({
                votes: reset ? nextItems : [...this.data.votes, ...nextItems],
                page: result.page,
                finished: result.page * result.pageSize >= result.total,
            });
        }
        catch (error) {
            this.setData({
                errorMessage: resolveErrorMessage(error),
                ...(reset
                    ? {
                        votes: [],
                        page: 1,
                        finished: true,
                    }
                    : {}),
            });
        }
        finally {
            this.setData({
                loading: false,
                isLoadMore: false,
            });
        }
    },
    openVoteDetail(event) {
        const { id } = event.currentTarget.dataset;
        if (!id) {
            return;
        }
        (0, nav_1.navigateTo)(routes_1.ROUTES.voting.detail, { id, mine: 1, houseId: app_1.appStore.getSelectedHouseId() || undefined });
    },
    onListRefresh(event) {
        void this.loadVotes(true).finally(() => {
            event?.detail?.done?.();
        });
    },
    onListLoadMore() {
        if (this.data.finished || this.data.isLoadMore || this.data.loading) {
            return;
        }
        void this.loadVotes(false);
    },
});
