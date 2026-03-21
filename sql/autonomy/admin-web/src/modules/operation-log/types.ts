export type OperationResourceType =
  | 'DISCLOSURE_CONTENT'
  | 'MANAGEMENT_FEE_PERIOD'
  | 'MANAGEMENT_FEE_RECORD'
  | 'BUILDING'
  | 'HOUSE'
  | 'MEMBER'
  | 'USER'
  | 'VOTE';
export type OperationAction = 'CREATE' | 'UPDATE' | 'PUBLISH' | 'DELETE' | 'STATUS_UPDATE';

export interface OperationLogItem {
  id: string;
  action: OperationAction | string;
  resourceType: OperationResourceType | string;
  resourceId: string;
  resourceName: string | null;
  actorLabel: string;
  ip: string | null;
  userAgent: string | null;
  snapshotJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedOperationLogList {
  items: OperationLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOperationLogListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  resourceType?: OperationResourceType;
  action?: OperationAction;
}

export const operationResourceTypeLabelMap: Record<OperationResourceType, string> = {
  DISCLOSURE_CONTENT: '信息公开内容',
  MANAGEMENT_FEE_PERIOD: '管理费时段',
  MANAGEMENT_FEE_RECORD: '管理费账目',
  BUILDING: '楼栋信息',
  HOUSE: '房屋信息',
  MEMBER: '成员关系',
  USER: '用户信息',
  VOTE: '投票管理',
};

export const operationActionLabelMap: Record<OperationAction, string> = {
  CREATE: '新建',
  UPDATE: '编辑',
  PUBLISH: '发布',
  DELETE: '删除',
  STATUS_UPDATE: '状态更新',
};

export const operationActionThemeMap: Record<OperationAction, 'primary' | 'success' | 'danger' | 'warning'> = {
  CREATE: 'primary',
  UPDATE: 'warning',
  PUBLISH: 'success',
  DELETE: 'danger',
  STATUS_UPDATE: 'primary',
};

export const operationResourceTypeOptions = [
  { label: '全部模块', value: 'ALL' },
  { label: operationResourceTypeLabelMap.DISCLOSURE_CONTENT, value: 'DISCLOSURE_CONTENT' },
  { label: operationResourceTypeLabelMap.MANAGEMENT_FEE_PERIOD, value: 'MANAGEMENT_FEE_PERIOD' },
  { label: operationResourceTypeLabelMap.MANAGEMENT_FEE_RECORD, value: 'MANAGEMENT_FEE_RECORD' },
  { label: operationResourceTypeLabelMap.BUILDING, value: 'BUILDING' },
  { label: operationResourceTypeLabelMap.HOUSE, value: 'HOUSE' },
  { label: operationResourceTypeLabelMap.MEMBER, value: 'MEMBER' },
  { label: operationResourceTypeLabelMap.USER, value: 'USER' },
  { label: operationResourceTypeLabelMap.VOTE, value: 'VOTE' },
];

export const operationActionOptions = [
  { label: '全部动作', value: 'ALL' },
  { label: operationActionLabelMap.CREATE, value: 'CREATE' },
  { label: operationActionLabelMap.UPDATE, value: 'UPDATE' },
  { label: operationActionLabelMap.PUBLISH, value: 'PUBLISH' },
  { label: operationActionLabelMap.DELETE, value: 'DELETE' },
  { label: operationActionLabelMap.STATUS_UPDATE, value: 'STATUS_UPDATE' },
];
