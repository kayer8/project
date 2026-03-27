"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../../constants/routes");
const vote_1 = require("../../../services/vote");
const app_1 = require("../../../store/app");
const nav_1 = require("../../../utils/nav");
function mapVoteCard(item) {
    return {
        ...item,
        typeLabel: (0, vote_1.formatVoteType)(item.type),
        statusLabel: (0, vote_1.formatVoteStatus)(item.status),
        deadlineLabel: (0, vote_1.formatVoteDeadline)(item.deadline),
    };
}
Component({
    options: {
        addGlobalClass: true,
    },
    data: {
        votes: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        errorMessage: '',
        page: 1,
        pageSize: 10,
    },
    lifetimes: {
        attached() {
            void this.refreshData();
        },
    },
    methods: {
        async refreshData() {
            await this.loadVotes(true);
        },
        async loadVotes(reset = false) {
            const nextPage = reset ? 1 : this.data.page + 1;
            this.setData({
                loading: reset,
                isLoadMore: !reset,
                errorMessage: '',
            });
            try {
                const result = await (0, vote_1.fetchVotes)({
                    page: nextPage,
                    pageSize: this.data.pageSize,
                });
                const nextItems = result.items.map(mapVoteCard);
                this.setData({
                    votes: reset ? nextItems : [...this.data.votes, ...nextItems],
                    page: result.page,
                    finished: result.page * result.pageSize >= result.total,
                });
            }
            catch (error) {
                this.setData({
                    errorMessage: error instanceof Error ? error.message : '投票列表加载失败',
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
            (0, nav_1.navigateTo)(routes_1.ROUTES.voting.detail, { id, houseId: app_1.appStore.getSelectedHouseId() || undefined });
        },
        openCreateVote(event) {
            const { type } = event.currentTarget.dataset;
            (0, nav_1.navigateTo)(routes_1.ROUTES.voting.create, type ? { type } : undefined);
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
    },
});
