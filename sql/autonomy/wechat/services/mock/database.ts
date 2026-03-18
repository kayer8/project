import { appStore } from '../../store/app';
import type {
  AnnouncementRecord,
  AuthIdentityType,
  BuildingPaymentRecord,
  DisclosureRecord,
  HouseDetail,
  HouseMember,
  HouseSummary,
  MessageRecord,
  UserProfile,
  VoteRecord,
} from './types';

const userProfile: UserProfile = {
  nickname: '陈嘉宁',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  communityName: '锦园自治社区',
  currentIdentityLabel: '主业主',
  authStatus: 'APPROVED',
  authStatusLabel: '已认证',
  unreadCount: 5,
};

const houseMembers1202: HouseMember[] = [
  {
    id: 'member-1',
    userName: '陈嘉宁',
    mobileMasked: '138****2201',
    identityType: '业主',
    relationLabel: '主业主',
    status: 'ACTIVE',
    statusLabel: '有效',
    isPrimaryRole: true,
    isVoteRepresentative: true,
    isPayer: true,
    canViewBill: true,
    canActAsAgent: true,
    canJoinConsultation: true,
    effectiveAt: '2025-02-01 10:00',
    history: [
      { time: '2025-02-01 10:00', content: '业主认证通过并成为主业主' },
      { time: '2025-03-10 19:40', content: '被设置为本房屋默认投票代表' },
    ],
  },
  {
    id: 'member-2',
    userName: '陈立安',
    mobileMasked: '139****3902',
    identityType: '家庭成员',
    relationLabel: '配偶',
    status: 'ACTIVE',
    statusLabel: '有效',
    isPrimaryRole: false,
    isVoteRepresentative: false,
    isPayer: false,
    canViewBill: true,
    canActAsAgent: true,
    canJoinConsultation: true,
    effectiveAt: '2025-02-06 15:20',
    history: [
      { time: '2025-02-06 15:20', content: '家庭成员加入并获得查看账单权限' },
    ],
  },
  {
    id: 'member-3',
    userName: '陈敬轩',
    mobileMasked: '137****5573',
    identityType: '代办人',
    relationLabel: '子女代办',
    status: 'PENDING',
    statusLabel: '待审核',
    isPrimaryRole: false,
    isVoteRepresentative: false,
    isPayer: false,
    canViewBill: true,
    canActAsAgent: true,
    canJoinConsultation: false,
    effectiveAt: '2026-03-16 09:30',
    history: [
      { time: '2026-03-16 09:30', content: '提交代办人加入申请，等待后台审核' },
    ],
  },
];

const houses: HouseDetail[] = [
  {
    id: 'house-2-1-1202',
    name: '2栋1单元1202',
    buildingName: '2栋',
    unitNo: '1单元',
    roomNo: '1202',
    status: 'SELF_OCCUPIED',
    statusLabel: '自住',
    identityLabel: '主业主',
    authStatusLabel: '已认证',
    hasVoteRight: true,
    isVoteRepresentative: true,
    memberCount: 3,
    groupName: '业主住户组',
    primaryRoleName: '陈嘉宁',
    voteRepresentativeName: '陈嘉宁',
    payerName: '陈嘉宁',
    members: houseMembers1202,
    notices: [
      { id: 'notice-1', title: '3月电梯维保安排', time: '2026-03-15 09:00' },
      { id: 'notice-2', title: '本栋公共照明整改说明', time: '2026-03-12 20:15' },
    ],
    votes: [
      { id: 'vote-1', title: '关于更换东门道闸的正式表决', statusLabel: '进行中' },
      { id: 'vote-2', title: '儿童活动区改造意见征集', statusLabel: '已结束' },
    ],
  },
  {
    id: 'house-5-2-803',
    name: '5栋2单元803',
    buildingName: '5栋',
    unitNo: '2单元',
    roomNo: '803',
    status: 'RENTED',
    statusLabel: '出租',
    identityLabel: '代办人',
    authStatusLabel: '已认证',
    hasVoteRight: false,
    isVoteRepresentative: false,
    memberCount: 2,
    groupName: '租户住户组',
    primaryRoleName: '李晓岚',
    voteRepresentativeName: '李晓岚',
    payerName: '李晓岚',
    members: [
      {
        id: 'member-4',
        userName: '李晓岚',
        mobileMasked: '135****9028',
        identityType: '租户',
        relationLabel: '主租户',
        status: 'ACTIVE',
        statusLabel: '有效',
        isPrimaryRole: true,
        isVoteRepresentative: true,
        isPayer: true,
        canViewBill: true,
        canActAsAgent: true,
        canJoinConsultation: true,
        effectiveAt: '2025-11-01 11:20',
        history: [{ time: '2025-11-01 11:20', content: '租户认证通过' }],
      },
      {
        id: 'member-5',
        userName: '陈嘉宁',
        mobileMasked: '138****2201',
        identityType: '代办人',
        relationLabel: '委托代办',
        status: 'ACTIVE',
        statusLabel: '有效',
        isPrimaryRole: false,
        isVoteRepresentative: false,
        isPayer: false,
        canViewBill: true,
        canActAsAgent: true,
        canJoinConsultation: false,
        effectiveAt: '2026-01-05 10:00',
        history: [{ time: '2026-01-05 10:00', content: '租户授权为代办人' }],
      },
    ],
    notices: [{ id: 'notice-3', title: '租户停车证更新提醒', time: '2026-03-09 08:10' }],
    votes: [{ id: 'vote-3', title: '电动车棚规划意见征集', statusLabel: '进行中' }],
  },
];

const votes: VoteRecord[] = [
  {
    id: 'vote-1',
    title: '关于更换东门道闸的正式表决',
    typeLabel: '正式表决',
    initiator: '社区委员会',
    scopeLabel: '全体业主住户组',
    startAt: '2026-03-18 09:00',
    endAt: '2026-03-25 20:00',
    status: 'ONGOING',
    statusLabel: '进行中',
    myStatusLabel: '待参与',
    houseId: 'house-2-1-1202',
    houseName: '2栋1单元1202',
    mode: 'HOUSEHOLD',
    modeLabel: '一户一票',
    canVote: true,
    hasVotedByHouse: false,
    allowRealtimeResult: false,
    description: '现有东门道闸故障率较高，拟更换为车牌识别一体机并同步改造门禁。请各户按正式表决规则参与。',
    rules: [
      '本次投票以房屋为单位计票，一户一票。',
      '当前账号需以投票代表身份参与。',
      '投票提交后不可修改。',
    ],
    options: [
      { id: 'op-1', title: '同意实施', description: '支持本月启动采购与施工', count: 86, ratio: '67%' },
      { id: 'op-2', title: '暂缓实施', description: '建议先补充预算说明', count: 31, ratio: '24%' },
      { id: 'op-3', title: '不同意', description: '维持现状并继续维修', count: 11, ratio: '9%' },
    ],
  },
  {
    id: 'vote-2',
    title: '儿童活动区改造意见征集',
    typeLabel: '意见征集',
    initiator: '公共空间工作组',
    scopeLabel: '全体认证成员',
    startAt: '2026-03-10 09:00',
    endAt: '2026-03-17 20:00',
    status: 'ENDED',
    statusLabel: '已结束',
    myStatusLabel: '已参与',
    houseId: 'house-2-1-1202',
    houseName: '2栋1单元1202',
    mode: 'PERSONAL',
    modeLabel: '一人一票',
    canVote: false,
    hasVotedByHouse: true,
    allowRealtimeResult: true,
    description: '围绕活动区地垫、照明、休闲座椅进行意见征集，结果作为设计输入。',
    rules: [
      '认证成员均可参与。',
      '可附加文字意见。',
      '实时结果对认证成员开放。',
    ],
    options: [
      { id: 'op-4', title: '优先改照明', description: '先解决夜间照明不足', count: 119, ratio: '48%' },
      { id: 'op-5', title: '优先改地垫', description: '改善安全与排水', count: 84, ratio: '34%' },
      { id: 'op-6', title: '增加休闲座椅', description: '增设家长看护座位', count: 46, ratio: '18%' },
    ],
  },
  {
    id: 'vote-3',
    title: '电动车棚规划意见征集',
    typeLabel: '意见征集',
    initiator: '社区治理小组',
    scopeLabel: '5栋租户住户组',
    startAt: '2026-03-17 10:00',
    endAt: '2026-03-22 20:00',
    status: 'ONGOING',
    statusLabel: '进行中',
    myStatusLabel: '已查看',
    houseId: 'house-5-2-803',
    houseName: '5栋2单元803',
    mode: 'PERSONAL',
    modeLabel: '一人一票',
    canVote: true,
    hasVotedByHouse: false,
    allowRealtimeResult: true,
    description: '征集5栋电动车停放区及雨棚布置方案，后续将纳入管理公开。',
    rules: ['租户与同住成员均可参与。', '投票后可查看实时统计。'],
    options: [
      { id: 'op-7', title: '靠近西侧入口', description: '方便通行，施工量较小', count: 18, ratio: '40%' },
      { id: 'op-8', title: '靠近快递点', description: '取件与停放动线一致', count: 15, ratio: '33%' },
      { id: 'op-9', title: '暂不新增', description: '先整治现有停放秩序', count: 12, ratio: '27%' },
    ],
  },
];

const announcements: AnnouncementRecord[] = [
  {
    id: 'notice-1',
    title: '3月电梯维保安排',
    category: '日常通知',
    issuer: '社区物业自治组',
    publishedAt: '2026-03-15 09:00',
    isPinned: true,
    readCount: 326,
    summary: '2栋与3栋电梯将于本周五分时段维保，请住户提前安排出行。',
    content: [
      '本周五 09:30-11:30 对 2栋电梯进行例行维保。',
      '15:00-17:00 对 3栋电梯进行安全检查。',
      '如遇紧急情况，请联系值守电话 400-886-1008。',
    ],
  },
  {
    id: 'notice-2',
    title: '本月议事协商会报名通知',
    category: '会议通知',
    issuer: '社区委员会',
    publishedAt: '2026-03-12 20:15',
    isPinned: false,
    readCount: 198,
    summary: '围绕停车秩序与儿童活动区改造，开放居民旁听报名。',
    content: ['协商会定于 3月23日晚 19:30 举行。', '每栋可报名 3 位居民旁听。'],
  },
  {
    id: 'notice-3',
    title: '租户停车证更新提醒',
    category: '证件提醒',
    issuer: '停车事务组',
    publishedAt: '2026-03-09 08:10',
    isPinned: false,
    readCount: 143,
    summary: '5栋、6栋租户车辆出入证将于月底统一更新。',
    content: ['请在 3月25日前提交车牌和租住信息。'],
  },
];

const disclosures: DisclosureRecord[] = [
  {
    id: 'disclosure-1',
    title: '东区照明整改进度公开',
    category: '问题整改',
    owner: '公共设施小组',
    publishedAt: '2026-03-16 18:00',
    summary: '已完成 2栋至4栋连廊照明勘查，首批更换灯具 28 套。',
    content: ['已完成现场勘查与报价。', '本周五起分楼栋更换。', '预计月底前全部收尾。'],
    relatedBuilding: '2栋、3栋、4栋',
    completed: false,
  },
  {
    id: 'disclosure-2',
    title: '志愿者巡查与垃圾分类月报',
    category: '志愿者动态',
    owner: '社区志愿组',
    publishedAt: '2026-03-14 09:30',
    summary: '本月新增 6 位志愿者，完成 3 次垃圾分类巡查与 2 场宣传活动。',
    content: ['分类准确率提升至 87%。', '将继续补充晚间投放引导。'],
    completed: true,
  },
  {
    id: 'disclosure-3',
    title: '3月管理费收支公开摘要',
    category: '财务公开',
    owner: '财务公开组',
    publishedAt: '2026-03-18 12:00',
    summary: '本月应收 12.8 万元，实收 11.4 万元，收缴率 89.1%。',
    content: ['电梯维保支出 1.2 万元。', '绿化补种支出 0.6 万元。', '保洁耗材支出 0.3 万元。'],
    completed: true,
  },
];

const buildingPayments: BuildingPaymentRecord[] = [
  {
    id: 'building-2',
    buildingName: '2栋',
    month: '2026-03',
    totalHouseholds: 64,
    dueHouseholds: 64,
    paidHouseholds: 58,
    unpaidHouseholds: 6,
    paidRate: '90.6%',
    trendLabel: '较上月 +2.1%',
    highlights: ['电梯维保已完成招标', '本栋停车线复划中'],
  },
  {
    id: 'building-5',
    buildingName: '5栋',
    month: '2026-03',
    totalHouseholds: 72,
    dueHouseholds: 72,
    paidHouseholds: 61,
    unpaidHouseholds: 11,
    paidRate: '84.7%',
    trendLabel: '较上月 -1.3%',
    highlights: ['租户更新率较高，提醒频次需提升', '快递点改造提案待征集结果'],
  },
];

const messages: MessageRecord[] = [
  {
    id: 'msg-1',
    category: '审核消息',
    title: '代办人加入申请待审核',
    content: '你为 2栋1单元1202 提交的代办人加入申请已进入审核队列。',
    publishedAt: '2026-03-16 09:35',
    unread: true,
    targetRoute: '/pages/member/manage/index?houseId=house-2-1-1202',
  },
  {
    id: 'msg-2',
    category: '投票提醒',
    title: '正式表决待参与',
    content: '关于更换东门道闸的正式表决仍未参与，请在截止前完成。',
    publishedAt: '2026-03-18 11:20',
    unread: true,
    targetRoute: '/pages/vote/detail/index?id=vote-1',
  },
  {
    id: 'msg-3',
    category: '公告提醒',
    title: '3月电梯维保安排已发布',
    content: '请查看本周五各楼栋电梯维保时间安排。',
    publishedAt: '2026-03-15 09:01',
    unread: false,
    targetRoute: '/pages/publicity/announcement-detail/index?id=notice-1',
  },
  {
    id: 'msg-4',
    category: '系统消息',
    title: '当前房屋已切换为 5栋2单元803',
    content: '你现在将以代办人身份查看该房屋相关事项。',
    publishedAt: '2026-03-11 18:05',
    unread: false,
  },
];

const authRules: Record<AuthIdentityType, string[]> = {
  OWNER: [
    '需填写姓名、手机号、房屋信息与关系说明。',
    '需上传房屋证明或授权资料。',
    '审核通过后可管理房屋成员并参与正式表决。',
  ],
  TENANT: [
    '需填写租住起止日期与租赁证明。',
    '主租户可管理同住成员与接收账单提醒。',
    '租户类事项可设置投票代表。',
  ],
  COMMITTEE: [
    '需填写职务、负责片区与任命证明。',
    '审核通过后可发起投票并发布公开内容。',
    '部分内容需由后台管理员二次确认。',
  ],
};

export function getProfile() {
  const currentHouse = getCurrentHouse();
  return {
    ...userProfile,
    currentIdentityLabel: currentHouse.identityLabel,
    unreadCount: messages.filter((item) => item.unread).length,
  };
}

export function getCurrentHouse() {
  const currentHouseId = appStore.getCurrentHouseId();
  return houses.find((item) => item.id === currentHouseId) || houses[0];
}

export function getOverview() {
  return {
    ongoingVoteCount: votes.filter((item) => item.status === 'ONGOING').length,
    latestDisclosureCount: disclosures.length,
    monthlyTasksCount: disclosures.filter((item) => item.category !== '财务公开').length,
    buildingPaidRateSummary: '2栋 90.6% / 5栋 84.7%',
  };
}

export function getHomeSections() {
  const currentHouse = getCurrentHouse();
  return {
    announcements: announcements.slice(0, 3),
    voteReminders: votes.filter((item) => item.status === 'ONGOING').slice(0, 2),
    disclosureHighlights: disclosures.slice(0, 3),
    currentHouse,
  };
}

export function getAuthRules(identity?: AuthIdentityType) {
  if (identity) {
    return authRules[identity];
  }
  return authRules;
}

export function getAuthResult(type?: AuthIdentityType) {
  const mapping: Record<AuthIdentityType, { statusLabel: string; submittedAt: string; reviewedAt?: string; rejectReason?: string }> = {
    OWNER: { statusLabel: '已通过', submittedAt: '2025-02-01 09:20', reviewedAt: '2025-02-02 14:10' },
    TENANT: { statusLabel: '审核中', submittedAt: '2026-03-17 10:00' },
    COMMITTEE: {
      statusLabel: '已驳回',
      submittedAt: '2026-02-25 16:30',
      reviewedAt: '2026-02-27 09:40',
      rejectReason: '请补充社区确认材料与任命证明原件照片。',
    },
  };
  return mapping[type || 'OWNER'];
}

export function getHouses() {
  return houses;
}

export function getHouseDetail(id?: string) {
  const targetId = id || appStore.getCurrentHouseId();
  return houses.find((item) => item.id === targetId) || houses[0];
}

export function getHouseMembers(houseId?: string) {
  return getHouseDetail(houseId).members;
}

export function getMemberDetail(memberId: string) {
  for (const house of houses) {
    const member = house.members.find((item) => item.id === memberId);
    if (member) {
      return { ...member, house };
    }
  }
  return null;
}

export function getVotes(filter?: 'ONGOING' | 'ENDED' | 'MINE') {
  if (filter === 'ONGOING') {
    return votes.filter((item) => item.status === 'ONGOING');
  }
  if (filter === 'ENDED') {
    return votes.filter((item) => item.status === 'ENDED');
  }
  if (filter === 'MINE') {
    return votes.filter((item) => item.houseId === appStore.getCurrentHouseId());
  }
  return votes;
}

export function getVoteDetail(id: string) {
  return votes.find((item) => item.id === id) || votes[0];
}

export function getAnnouncements() {
  return announcements;
}

export function getAnnouncementDetail(id: string) {
  return announcements.find((item) => item.id === id) || announcements[0];
}

export function getDisclosures(category?: string) {
  if (!category || category === 'ALL') {
    return disclosures;
  }
  return disclosures.filter((item) => item.category === category);
}

export function getDisclosureDetail(id: string) {
  return disclosures.find((item) => item.id === id) || disclosures[0];
}

export function getBuildingPayments() {
  return buildingPayments;
}

export function getBuildingPaymentDetail(id: string) {
  return buildingPayments.find((item) => item.id === id) || buildingPayments[0];
}

export function getMessages() {
  return messages;
}
