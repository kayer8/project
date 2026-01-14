import { defineStore } from 'pinia';

export interface TabItem {
  title: string;
  path: string;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabItem[],
  }),
  actions: {
    addTab(tab: TabItem) {
      if (!this.tabs.find((item) => item.path === tab.path)) {
        this.tabs.push(tab);
      }
    },
    removeTab(path: string) {
      this.tabs = this.tabs.filter((tab) => tab.path !== path);
    },
    clearTabs() {
      this.tabs = [];
    },
  },
});