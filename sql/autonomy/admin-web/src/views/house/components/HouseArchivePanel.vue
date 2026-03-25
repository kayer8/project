<template>
  <t-card title="预绑定手机号">
    <template #actions>
      <t-button theme="primary" size="small" @click="openCreate">新增手机号</t-button>
    </template>

    <div v-if="archives.length === 0" class="empty-text">
      当前房屋还没有预绑定手机号。录入后，小程序可按手机号自动匹配并绑定房屋。
    </div>

    <t-table
      v-else
      :data="archives"
      :columns="columns"
      row-key="id"
      size="small"
      table-layout="fixed"
    >
      <template #status="{ row }">
        <t-tag :theme="getStatusTheme(row.status)" variant="light-outline">
          {{ statusLabelMap[row.status] ?? row.status }}
        </t-tag>
      </template>

      <template #matchedUser="{ row }">
        <span v-if="row.matchedUserName">{{ row.matchedUserName }}</span>
        <span v-else class="table-subtext">未匹配</span>
      </template>

      <template #matchedAt="{ row }">
        {{ formatDateTime(row.matchedAt, '未匹配') }}
      </template>

      <template #updatedAt="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>

      <template #actions="{ row }">
        <div class="action-link-group">
          <t-button variant="text" @click="openEdit(row)">编辑</t-button>
          <t-button variant="text" theme="danger" @click="handleRemove(row)">停用</t-button>
        </div>
      </template>
    </t-table>

    <HouseArchiveFormDialog
      v-model:visible="dialogVisible"
      :house-id="houseId"
      :mode="dialogMode"
      :initial-value="editingArchive"
      @success="handleSuccess"
    />
  </t-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { removeHouseArchive } from '@/modules/house/api';
import type { HouseResidentArchiveItem } from '@/modules/house/types';
import { formatDateTime } from '@/utils/format';
import HouseArchiveFormDialog from './HouseArchiveFormDialog.vue';

const statusLabelMap: Record<string, string> = {
  ACTIVE: '可匹配',
  SYNCED: '已匹配',
  DISABLED: '已停用',
};

const props = defineProps<{
  houseId: string;
  archives: HouseResidentArchiveItem[];
}>();

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingArchive = ref<HouseResidentArchiveItem | null>(null);

const columns = computed(() => [
  { colKey: 'mobile', title: '手机号', width: 150 },
  { colKey: 'realName', title: '姓名', width: 120, ellipsis: true },
  { colKey: 'relationType', title: '关系类型', width: 120, ellipsis: true },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'matchedUser', title: '已匹配用户', width: 140, ellipsis: true },
  { colKey: 'matchedAt', title: '匹配时间', width: 160 },
  { colKey: 'remark', title: '备注', minWidth: 180, ellipsis: true },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' },
]);

function getStatusTheme(status: string) {
  if (status === 'SYNCED') return 'success';
  if (status === 'DISABLED') return 'danger';
  return 'primary';
}

function openCreate() {
  dialogMode.value = 'create';
  editingArchive.value = null;
  dialogVisible.value = true;
}

function openEdit(item: HouseResidentArchiveItem) {
  dialogMode.value = 'edit';
  editingArchive.value = item;
  dialogVisible.value = true;
}

function handleSuccess() {
  editingArchive.value = null;
  emit('success');
}

function handleRemove(item: HouseResidentArchiveItem) {
  const dialog = DialogPlugin.confirm({
    header: '确认停用预绑定手机号',
    body: `停用后，该手机号将不再参与自动绑定。\n\n手机号：${item.mobile}`,
    confirmBtn: '确认停用',
    cancelBtn: '取消',
    onConfirm: async () => {
      await removeHouseArchive(props.houseId, item.id);
      MessagePlugin.success('预绑定手机号已停用');
      emit('success');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}
</script>

<style scoped>
.empty-text {
  color: #64748b;
}
</style>
