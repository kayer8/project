export interface VoteRecord {
  id: string;
  title: string;
  type: '正式表决' | '意见征集';
  sponsor: string;
  scope: string;
  participantCount: number;
  participationRate: string;
  deadline: string;
  status: '进行中' | '已结束' | '草稿';
  publishAt: string;
}

export interface VoteResultRecord {
  id: string;
  title: string;
  type: '正式表决' | '意见征集';
  totalHouseholds: number;
  votedHouseholds: number;
  passRate: string;
  result: '通过' | '未通过' | '统计中';
  endedAt: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  category: string;
  issuer: string;
  publishAt: string;
  status: '已发布' | '草稿' | '待发布';
  priority: '普通' | '重点';
  isPinned: boolean;
}

export interface AnnouncementCategoryRecord {
  id: string;
  name: string;
  code: string;
  visibility: '全体居民' | '认证住户' | '委员会内部';
  count: number;
  updatedAt: string;
  status: '启用' | '停用';
}

export interface DisclosureRecord {
  id: string;
  title: string;
  category: '财务公开' | '会议纪要' | '管理公开' | '通知公示';
  owner: string;
  status: '已发布' | '草稿' | '待审核';
  publishWindow: string;
  updatedAt: string;
}

export interface PublishRecord {
  id: string;
  title: string;
  category: string;
  publisher: string;
  channel: string;
  result: '成功' | '失败' | '待重试';
  publishedAt: string;
}

export interface OwnerReviewRecord {
  id: string;
  name: string;
  mobile: string;
  house: string;
  role: '业主' | '租户' | '委员会成员';
  status: '待审核' | '已通过' | '已拒绝';
  submittedAt: string;
}

export interface OwnerRecord {
  id: string;
  name: string;
  mobile: string;
  house: string;
  identity: '业主' | '租户' | '家庭成员';
  authStatus: '已认证' | '待补充材料' | '已失效';
  voteQualification: '有资格' | '需授权' | '无资格';
  updatedAt: string;
}

export const voteRecords: VoteRecord[] = [
  {
    id: 'V-202603-01',
    title: '2026 年公共收益使用方案表决',
    type: '正式表决',
    sponsor: '业委会秘书处',
    scope: '全体业主',
    participantCount: 168,
    participationRate: '72.4%',
    deadline: '2026-03-25 18:00',
    status: '进行中',
    publishAt: '2026-03-18 09:30',
  },
  {
    id: 'V-202603-02',
    title: '地库门禁升级意见征集',
    type: '意见征集',
    sponsor: '物业服务中心',
    scope: '认证住户',
    participantCount: 214,
    participationRate: '61.2%',
    deadline: '2026-03-28 20:00',
    status: '进行中',
    publishAt: '2026-03-17 14:00',
  },
  {
    id: 'V-202602-05',
    title: '2026 年第一季度维修基金使用表决',
    type: '正式表决',
    sponsor: '业委会秘书处',
    scope: '全体业主',
    participantCount: 253,
    participationRate: '88.1%',
    deadline: '2026-02-28 18:00',
    status: '已结束',
    publishAt: '2026-02-21 10:00',
  },
  {
    id: 'V-202602-07',
    title: '儿童活动区改造方案',
    type: '意见征集',
    sponsor: '社区运营组',
    scope: '认证住户',
    participantCount: 0,
    participationRate: '0%',
    deadline: '2026-03-30 21:00',
    status: '草稿',
    publishAt: '2026-03-20 09:00',
  },
];

export const voteResultRecords: VoteResultRecord[] = [
  {
    id: 'VR-202602-05',
    title: '2026 年第一季度维修基金使用表决',
    type: '正式表决',
    totalHouseholds: 287,
    votedHouseholds: 253,
    passRate: '84.6%',
    result: '通过',
    endedAt: '2026-02-28 18:00',
  },
  {
    id: 'VR-202601-04',
    title: '东门停车动线调整意见征集',
    type: '意见征集',
    totalHouseholds: 350,
    votedHouseholds: 198,
    passRate: '56.5%',
    result: '统计中',
    endedAt: '2026-01-30 19:30',
  },
  {
    id: 'VR-202512-09',
    title: '电梯广告收益分配方案',
    type: '正式表决',
    totalHouseholds: 287,
    votedHouseholds: 241,
    passRate: '78.2%',
    result: '未通过',
    endedAt: '2025-12-25 18:00',
  },
];

export const announcementRecords: AnnouncementRecord[] = [
  {
    id: 'A-001',
    title: '关于 3 月度消防联检安排的通知',
    category: '社区公告',
    issuer: '物业服务中心',
    publishAt: '2026-03-20 08:00',
    status: '已发布',
    priority: '重点',
    isPinned: true,
  },
  {
    id: 'A-002',
    title: '清明节期间门岗值班与访客登记说明',
    category: '通知公告',
    issuer: '社区办公室',
    publishAt: '2026-03-19 17:30',
    status: '已发布',
    priority: '普通',
    isPinned: false,
  },
  {
    id: 'A-003',
    title: '停车场月租续费流程更新',
    category: '办事指南',
    issuer: '物业服务中心',
    publishAt: '2026-03-18 12:00',
    status: '草稿',
    priority: '普通',
    isPinned: false,
  },
];

export const announcementCategoryRecords: AnnouncementCategoryRecord[] = [
  {
    id: 'C-01',
    name: '社区公告',
    code: 'ANN_COMMUNITY',
    visibility: '全体居民',
    count: 28,
    updatedAt: '2026-03-18 10:00',
    status: '启用',
  },
  {
    id: 'C-02',
    name: '通知公告',
    code: 'ANN_NOTICE',
    visibility: '认证住户',
    count: 16,
    updatedAt: '2026-03-12 09:20',
    status: '启用',
  },
  {
    id: 'C-03',
    name: '委员会内部',
    code: 'ANN_COMMITTEE',
    visibility: '委员会内部',
    count: 8,
    updatedAt: '2026-03-01 14:00',
    status: '停用',
  },
];

export const disclosureRecords: DisclosureRecord[] = [
  {
    id: 'D-001',
    title: '2026 年 2 月财务收支公开',
    category: '财务公开',
    owner: '财务管理员',
    status: '已发布',
    publishWindow: '2026-03-01 至 2026-03-31',
    updatedAt: '2026-03-05 11:00',
  },
  {
    id: 'D-002',
    title: '第二届业委会第三次例会纪要',
    category: '会议纪要',
    owner: '业委会秘书处',
    status: '待审核',
    publishWindow: '待定',
    updatedAt: '2026-03-18 16:20',
  },
  {
    id: 'D-003',
    title: '公共区域保洁整改结果公示',
    category: '管理公开',
    owner: '物业服务中心',
    status: '草稿',
    publishWindow: '待定',
    updatedAt: '2026-03-20 09:15',
  },
];

export const publishRecords: PublishRecord[] = [
  {
    id: 'P-001',
    title: '2026 年 2 月财务收支公开',
    category: '财务公开',
    publisher: '财务管理员',
    channel: '信息公开中心',
    result: '成功',
    publishedAt: '2026-03-05 11:00',
  },
  {
    id: 'P-002',
    title: '关于 3 月度消防联检安排的通知',
    category: '社区公告',
    publisher: '物业服务中心',
    channel: '公告通知',
    result: '成功',
    publishedAt: '2026-03-20 08:00',
  },
  {
    id: 'P-003',
    title: '第二届业委会第三次例会纪要',
    category: '会议纪要',
    publisher: '业委会秘书处',
    channel: '信息公开中心',
    result: '待重试',
    publishedAt: '2026-03-18 16:30',
  },
];

export const ownerReviewRecords: OwnerReviewRecord[] = [
  {
    id: 'R-001',
    name: '张明',
    mobile: '138****1203',
    house: '1 栋 1 单元 1202',
    role: '业主',
    status: '待审核',
    submittedAt: '2026-03-20 09:18',
  },
  {
    id: 'R-002',
    name: '李芳',
    mobile: '139****7711',
    house: '2 栋 2 单元 802',
    role: '租户',
    status: '已通过',
    submittedAt: '2026-03-19 20:10',
  },
  {
    id: 'R-003',
    name: '陈悦',
    mobile: '136****2266',
    house: '5 栋 1 单元 603',
    role: '委员会成员',
    status: '已拒绝',
    submittedAt: '2026-03-18 13:45',
  },
];

export const ownerRecords: OwnerRecord[] = [
  {
    id: 'O-001',
    name: '张明',
    mobile: '138****1203',
    house: '1 栋 1 单元 1202',
    identity: '业主',
    authStatus: '已认证',
    voteQualification: '有资格',
    updatedAt: '2026-03-20 09:20',
  },
  {
    id: 'O-002',
    name: '李芳',
    mobile: '139****7711',
    house: '2 栋 2 单元 802',
    identity: '租户',
    authStatus: '已认证',
    voteQualification: '需授权',
    updatedAt: '2026-03-19 20:15',
  },
  {
    id: 'O-003',
    name: '周宁',
    mobile: '137****0199',
    house: '3 栋 1 单元 1701',
    identity: '家庭成员',
    authStatus: '待补充材料',
    voteQualification: '无资格',
    updatedAt: '2026-03-17 15:30',
  },
];
