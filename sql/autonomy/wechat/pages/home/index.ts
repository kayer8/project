const TABS = ['disclosure', 'voting', 'profile'] as const;

type TabValue = (typeof TABS)[number];

function isTabValue(value?: string): value is TabValue {
  return !!value && TABS.includes(value as TabValue);
}

Page({
  data: {
    activeTab: 'disclosure' as TabValue,
  },

  onLoad(query: Record<string, string | undefined>) {
    if (isTabValue(query.tab)) {
      this.setData({ activeTab: query.tab });
    }
  },

  handleTabChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const value = event.detail?.value;

    if (!isTabValue(value) || value === this.data.activeTab) {
      return;
    }

    this.setData({ activeTab: value });
  },
});
