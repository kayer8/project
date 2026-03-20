<template>
  <PageContainer title="数据总览">
    <template #actions>
      <t-button theme="primary" variant="outline">导出概览</t-button>
    </template>

    <section class="table-summary-grid">
      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">治理待办</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <t-table :data="todoItems" :columns="todoColumns" row-key="title" size="small" bordered />
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">快捷动作</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <div class="quick-grid">
            <button v-for="item in quickActions" :key="item.title" class="quick-card" type="button">
              <div class="quick-card__title">{{ item.title }}</div>
              <div class="quick-card__desc">{{ item.description }}</div>
            </button>
          </div>
        </div>
      </section>
    </section>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">最近发布动态</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="recentPublishRows" :columns="publishColumns" row-key="id" size="small" bordered />
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
import {
  announcementRecords,
  ownerReviewRecords,
  publishRecords,
  voteRecords,
} from '@/mock/governance';

const todoColumns = [
  { colKey: 'title', title: '事项名称', ellipsis: true },
  { colKey: 'owner', title: '归属模块', width: 120 },
  { colKey: 'deadline', title: '要求完成时间', width: 160 },
  { colKey: 'status', title: '状态', width: 110 },
];

const todoItems = [
  { title: '审核新提交的业主认证资料', owner: '认证审核', deadline: '今日 18:00', status: '待审核' },
  { title: '检查即将截止的公共收益使用表决', owner: '投票列表', deadline: '03-25 18:00', status: '进行中' },
  { title: '发布 3 月消防联检正式公告', owner: '公告列表', deadline: '今日 17:00', status: '待发布' },
  { title: '复核会议纪要对外公开版本', owner: '内容管理', deadline: '本周内', status: '待审核' },
];

const quickActions = [
  { title: '去审核', description: '处理业主、租户和委员会认证申请' },
  { title: '发公告', description: '创建正式公告并设置置顶与发布时间' },
  { title: '发投票', description: '发起治理类投票并配置表决范围' },
  { title: '更新公开内容', description: '同步财务、会议和管理公开信息' },
];

const publishColumns = [
  { colKey: 'title', title: '内容标题', ellipsis: true },
  { colKey: 'category', title: '分类', width: 120 },
  { colKey: 'publisher', title: '发布人', width: 120 },
  { colKey: 'channel', title: '发布渠道', width: 140 },
  { colKey: 'result', title: '结果', width: 100 },
  { colKey: 'publishedAt', title: '发布时间', width: 160 },
];

const recentPublishRows = publishRecords;
</script>
