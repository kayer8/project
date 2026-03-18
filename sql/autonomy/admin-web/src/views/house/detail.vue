<template>
  <PageContainer
    title="房屋详情"
    description="查看房屋基础档案、住户组、成员关系和当前生效的投票代表。"
  >
    <div class="page-actions">
      <t-button variant="outline" @click="router.push('/houses/list')">返回列表</t-button>
      <t-button v-if="house" variant="outline" theme="primary" @click="openEdit">编辑房屋</t-button>
      <t-button v-if="house" variant="outline" theme="danger" @click="handleDelete">删除房屋</t-button>
    </div>

    <t-card v-if="!house" title="未找到房屋">
      <div class="empty-text">当前房屋不存在，或接口暂未返回数据。</div>
    </t-card>

    <template v-else>
      <t-row :gutter="[16, 16]">
        <t-col :span="6">
          <t-card title="房屋资料">
            <div class="info-grid">
              <div class="label">展示名称</div>
              <div>{{ house.displayName }}</div>
              <div class="label">所属楼栋</div>
              <div>{{ house.buildingName }}</div>
              <div class="label">单元号</div>
              <div>{{ formatText(house.unitNo, '无') }}</div>
              <div class="label">楼层号</div>
              <div>{{ formatText(house.floorNo, '未设置') }}</div>
              <div class="label">房号</div>
              <div>{{ house.roomNo }}</div>
              <div class="label">房屋状态</div>
              <div>
                <t-tag :theme="getHouseStatusTheme(house.houseStatus)" variant="light">
                  {{ houseStatusLabelMap[house.houseStatus] }}
                </t-tag>
              </div>
              <div class="label">建筑面积</div>
              <div>{{ formatArea(house.grossArea) }}</div>
              <div class="label">当前住户组</div>
              <div>{{ formatText(house.householdGroups[0]?.groupTypeLabel, '暂无') }}</div>
              <div class="label">当前成员数</div>
              <div>{{ house.members.length }}</div>
              <div class="label">创建时间</div>
              <div>{{ formatDateTime(house.createdAt) }}</div>
              <div class="label">更新时间</div>
              <div>{{ formatDateTime(house.updatedAt) }}</div>
            </div>
          </t-card>
        </t-col>

        <t-col :span="6">
          <t-card title="住户组">
            <t-table :data="house.householdGroups" :columns="groupColumns" row-key="id" size="small">
              <template #startedAt="{ row }">
                {{ formatDateTime(row.startedAt) }}
              </template>

              <template #endedAt="{ row }">
                {{ formatDateTime(row.endedAt, '未结束') }}
              </template>
            </t-table>
          </t-card>
        </t-col>
      </t-row>

      <t-card title="成员关系">
        <t-table :data="house.members" :columns="memberColumns" row-key="id" size="small">
          <template #status="{ row }">
            <t-tag :theme="getMemberStatusTheme(row.status)" variant="light">
              {{ row.status }}
            </t-tag>
          </template>

          <template #permissions="{ row }">
            <div class="tag-group">
              <t-tag v-if="row.isPrimaryRole" theme="primary" variant="light">主角色</t-tag>
              <t-tag v-if="row.canViewBill" variant="light">可看账单</t-tag>
              <t-tag v-if="row.canPayBill" variant="light">可缴费</t-tag>
              <t-tag v-if="row.canActAsAgent" variant="light">可代办</t-tag>
              <t-tag v-if="row.canJoinConsultation" variant="light">可征集意见</t-tag>
              <t-tag v-if="row.canBeVoteDelegate" variant="light">可做投票代表</t-tag>
            </div>
          </template>

          <template #effectiveAt="{ row }">
            {{ formatDateTime(row.effectiveAt) }}
          </template>

          <template #actions="{ row }">
            <div class="action-group">
              <t-button variant="text" theme="primary" @click="router.push(`/members/${row.id}`)">
                成员详情
              </t-button>
              <t-button variant="text" @click="router.push(`/users/${row.userId}`)">用户详情</t-button>
            </div>
          </template>
        </t-table>
      </t-card>

      <t-card title="投票代表">
        <div v-if="house.activeVoteRepresentatives.length === 0" class="empty-text">当前没有生效中的投票代表。</div>
        <t-table
          v-else
          :data="house.activeVoteRepresentatives"
          :columns="voteColumns"
          row-key="id"
          size="small"
        >
          <template #effectiveAt="{ row }">
            {{ formatDateTime(row.effectiveAt) }}
          </template>

          <template #expiredAt="{ row }">
            {{ formatDateTime(row.expiredAt, '长期有效') }}
          </template>
        </t-table>
      </t-card>
    </template>

    <HouseFormDialog
      v-model:visible="dialogVisible"
      mode="edit"
      :initial-value="house"
      @success="loadDetail"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchHouseDetail, removeHouse } from '@/modules/house/api';
import type { HouseDetail } from '@/modules/house/types';
import { houseStatusLabelMap } from '@/modules/house/types';
import { formatArea, formatDateTime, formatText } from '@/utils/format';
import HouseFormDialog from './components/HouseFormDialog.vue';

const route = useRoute();
const router = useRouter();
const house = ref<HouseDetail | null>(null);
const dialogVisible = ref(false);

const groupColumns = [
  { colKey: 'groupTypeLabel', title: '住户组类型', width: 140 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'memberCount', title: '成员数', width: 100 },
  { colKey: 'startedAt', title: '开始时间', width: 160 },
  { colKey: 'endedAt', title: '结束时间', width: 160 },
];

const memberColumns = [
  { colKey: 'userName', title: '用户', width: 140 },
  { colKey: 'mobile', title: '手机号', width: 150 },
  { colKey: 'relationLabel', title: '关系', width: 120 },
  { colKey: 'householdType', title: '住户组', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'permissions', title: '权限', minWidth: 260 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 160 },
];

const voteColumns = [
  { colKey: 'representativeUserName', title: '代表用户', width: 140 },
  { colKey: 'scopeType', title: '授权范围', width: 120 },
  { colKey: 'voteId', title: '投票 ID', width: 180 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
  { colKey: 'expiredAt', title: '失效时间', width: 160 },
];

function getHouseStatusTheme(status: HouseDetail['houseStatus']) {
  if (status === 'SELF_OCCUPIED') {
    return 'success';
  }
  if (status === 'RENTED') {
    return 'warning';
  }
  if (status === 'VACANT') {
    return 'default';
  }
  return 'primary';
}

function getMemberStatusTheme(status: string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  if (status === 'REMOVED' || status === 'REJECTED') {
    return 'danger';
  }
  return 'default';
}

async function loadDetail() {
  const id = String(route.params.id || '');
  if (!id) {
    house.value = null;
    return;
  }

  house.value = await fetchHouseDetail(id);
}

function openEdit() {
  dialogVisible.value = true;
}

async function handleDelete() {
  if (!house.value || !window.confirm('确认删除这套房屋吗？')) {
    return;
  }

  await removeHouse(house.value.id);
  void router.push('/houses/list');
}

onMounted(() => {
  void loadDetail();
});

watch(
  () => route.params.id,
  () => {
    void loadDetail();
  },
);
</script>

<style scoped>
.page-actions {
  display: flex;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: start;
}

.label,
.empty-text {
  color: #64748b;
}

.tag-group,
.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
