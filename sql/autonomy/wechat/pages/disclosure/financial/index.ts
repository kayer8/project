import { budgetItems, financialReports, transactions } from '../../../mock/community';

Page({
  data: {
    activeTab: 'reports',
    transactionFilter: 'all',
    reports: financialReports,
    transactions,
    budgets: budgetItems,
  },

  handleTabChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ activeTab: String(event.detail?.value || 'reports') });
  },

  handleFilterChange(event: WechatMiniprogram.BaseEvent) {
    const { filter } = event.currentTarget.dataset as { filter?: string };

    if (!filter) {
      return;
    }

    this.setData({ transactionFilter: filter });
  },
});
