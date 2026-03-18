<template>
  <div class="default-layout">
    <aside class="sidebar">
      <div class="brand">物业自治</div>
      <RouterLink class="nav-link" to="/dashboard">工作台</RouterLink>
    </aside>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px 1fr;
  background: #f4f6f8;
}

.sidebar {
  padding: 24px 16px;
  background: #0f172a;
  color: #fff;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

.nav-link {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: #dbe4f0;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.04);
}

.content {
  padding: 24px;
}
</style>
