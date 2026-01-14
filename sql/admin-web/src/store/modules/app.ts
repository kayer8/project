import { defineStore } from 'pinia';
import { APP_TITLE } from '@/config/app';

export const useAppStore = defineStore('app', {
  state: () => ({
    title: APP_TITLE,
    sidebarCollapsed: false,
    enableTabs: false,
  }),
  actions: {
    toggleSidebar(collapsed?: boolean) {
      if (typeof collapsed === 'boolean') {
        this.sidebarCollapsed = collapsed;
      } else {
        this.sidebarCollapsed = !this.sidebarCollapsed;
      }
    },
  },
});