"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../../mock/community");
Page({
    data: {
        activeTab: 'reports',
        transactionFilter: 'all',
        reports: community_1.financialReports,
        transactions: community_1.transactions,
        budgets: community_1.budgetItems,
    },
    handleTabChange(event) {
        this.setData({ activeTab: String(event.detail?.value || 'reports') });
    },
    handleFilterChange(event) {
        const { filter } = event.currentTarget.dataset;
        if (!filter) {
            return;
        }
        this.setData({ transactionFilter: filter });
    },
});
