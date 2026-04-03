<template>
  <div class="default-layout">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__brand-mark">AD</div>
        <div>
          <div class="sidebar__brand-title">Admin Shell</div>
          <div class="sidebar__brand-subtitle">Framework retained</div>
        </div>
      </div>

      <div class="sidebar__nav">
        <section
          v-for="group in menuGroups"
          :key="group.title"
          class="sidebar__group"
        >
          <div class="sidebar__group-title">{{ group.title }}</div>
          <nav class="sidebar__group-list">
            <RouterLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="sidebar__link"
              :class="{ 'is-active': isActive(item.matchPrefix) }"
            >
              <component :is="iconMap[item.icon]" class="sidebar__link-icon" />
              <div class="sidebar__link-content">
                <span class="sidebar__link-title">{{ item.title }}</span>
              </div>
            </RouterLink>
          </nav>
        </section>
      </div>
    </aside>

    <div class="layout-shell">
      <header class="topbar">
        <div>
          <div class="topbar__eyebrow">Admin application skeleton</div>
          <div class="topbar__title">{{ currentTitle }}</div>
        </div>
        <div class="topbar__meta">
          <div class="topbar__status">Framework only</div>
          <div class="topbar__user">
            <div class="topbar__avatar">A</div>
            <div>
              <div class="topbar__user-name">Local Shell</div>
              <div class="topbar__user-role">Single-page mode</div>
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HomeIcon } from 'tdesign-icons-vue-next';
import { flatMenuItems, menuGroups } from '@/config/menu';

const route = useRoute();

const iconMap = {
  home: HomeIcon,
};

const currentMenu = computed(() =>
  flatMenuItems.find((item) => route.path.startsWith(item.matchPrefix)),
);

const currentTitle = computed(
  () => (route.meta.title as string | undefined) ?? currentMenu.value?.title ?? 'Home',
);

function isActive(prefix: string) {
  if (prefix === '/') {
    return route.path === '/';
  }

  return route.path.startsWith(prefix);
}
</script>
