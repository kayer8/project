<template>
  <PageContainer title="分类管理">
    <template #actions>
      <t-button theme="primary">新建分类</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">分类列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="announcementCategoryRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #nameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.name }}</div>
              <div class="table-subtext">编码 {{ row.code }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="row.status === '启用' ? 'success' : 'warning'" variant="light-outline">
              {{ row.status }}
            </t-tag>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="notifyAction('编辑', row.name)">编辑</t-button>
              <t-button variant="text" theme="primary" @click="notifyAction('调整范围', row.name)">
                范围
              </t-button>
            </div>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { announcementCategoryRecords } from '@/mock/governance';

const columns = [
  { colKey: 'nameCell', title: '分类名称', minWidth: 220 },
  { colKey: 'visibility', title: '可见范围', width: 140 },
  { colKey: 'count', title: '内容数', width: 100 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'actions', title: '操作', width: 160, fixed: 'right' },
];

function notifyAction(action: string, name: string) {
  MessagePlugin.info(`${action}：${name}`);
}
</script>
