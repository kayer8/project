<template>
  <div class="default-layout">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__brand-mark">治</div>
        <div>
          <div class="sidebar__brand-title">社区物业自治系统</div>
          <div class="sidebar__brand-subtitle">管理后台</div>
        </div>
      </div>

      <div class="sidebar__nav">
        <section v-for="group in menuGroups" :key="group.title" class="sidebar__group">
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
          <div class="topbar__eyebrow">社区治理数字中台</div>
          <div class="topbar__title">{{ currentTitle }}</div>
        </div>
        <div class="topbar__meta">
          <div class="topbar__status">系统运行正常</div>
          <div class="topbar__user">
            <div class="topbar__avatar">A</div>
            <div>
              <div class="topbar__user-name">管理员</div>
              <div class="topbar__user-role">系统运营账号</div>
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
import {
  BuildingIcon,
  CatalogIcon,
  ChartBarIcon,
  CheckCircleIcon,
  FileIcon,
  HomeIcon,
  NotificationIcon,
  SendIcon,
  SystemSettingIcon,
  UserListIcon,
  ViewListIcon,
} from 'tdesign-icons-vue-next';
import { flatMenuItems, menuGroups } from '@/config/menu';

const route = useRoute();

const iconMap = {
  dashboard: ChartBarIcon,
  vote: CatalogIcon,
  'vote-result': CheckCircleIcon,
  announcement: NotificationIcon,
  category: FileIcon,
  disclosure: CatalogIcon,
  publish: SendIcon,
  'management-fee': ChartBarIcon,
  house: HomeIcon,
  building: BuildingIcon,
  member: ViewListIcon,
  review: CheckCircleIcon,
  owner: UserListIcon,
  setting: SystemSettingIcon,
};

const currentMenu = computed(() =>
  flatMenuItems.find((item) => route.path.startsWith(item.matchPrefix)),
);

const currentTitle = computed(
  () => (route.meta.title as string | undefined) ?? currentMenu.value?.title ?? '管理后台',
);

function isActive(prefix: string) {
  return route.path.startsWith(prefix);
}
</script>
