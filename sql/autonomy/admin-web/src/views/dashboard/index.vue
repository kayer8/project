<template>
  <PageContainer title="数据总览">
    <template #actions>
      <t-button theme="primary" variant="outline">导出概览</t-button>
    </template>

    <section class="stats-strip">
      <article v-for="item in summaryCards" :key="item.title" class="stat-card">
        <div class="stat-card__label">{{ item.title }}</div>
        <div class="stat-card__value">{{ item.value }}</div>
        <div class="stat-card__meta">{{ item.description }}</div>
      </article>
    </section>

    <section class="table-summary-grid">
      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">治理待办</div>
            <div class="admin-panel__desc">优先处理认证审核、草稿待发布和即将截止的投票事项。</div>
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
            <div class="admin-panel__desc">结合文档中管理端主链路，优先保留高频治理动作。</div>
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
          <div class="admin-panel__desc">展示公告与信息公开的最近发布记录，便于快速核对内容是否已对外生效。</div>
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

const summaryCards = [
  {
    title: '进行中投票',
    value: voteRecords.filter((item) => item.status === '进行中').length,
    description: '包括正式表决与意见征集两类事项',
  },
  {
    title: '已发布公告',
    value: announcementRecords.filter((item) => item.status === '已发布').length,
    description: '当前可对居民公开查看的公告总数',
  },
  {
    title: '待审核认证',
    value: ownerReviewRecords.filter((item) => item.status === '待审核').length,
    description: '需要管理员人工确认身份材料的申请数量',
  },
  {
    title: '发布成功率',
    value: '96%',
    description: '最近 30 天公告与公开内容发布成功率',
  },
];

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
