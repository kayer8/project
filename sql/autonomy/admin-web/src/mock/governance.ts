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
