import { ROUTES } from '../constants/routes';

export const houseOptions = [
  {
    id: 'house-1',
    name: '3号楼 1202',
    community: '锦绣花园',
    role: '业主认证',
    owner: '张康',
  },
  {
    id: 'house-2',
    name: '8号楼 501',
    community: '锦绣花园',
    role: '租户认证',
    owner: '王大锤',
  },
  {
    id: 'house-3',
    name: '1号楼 2003',
    community: '锦绣花园',
    role: '业主认证',
    owner: '李梅',
  },
];

export const workbenchStats = [
  { label: '待办事项', value: '0', note: '暂无待办' },
  { label: '参与投票', value: '3', note: '社区决策', url: ROUTES.voting.index },
  { label: '社区消息', value: '2', note: '最新公告', url: ROUTES.disclosure.announcements },
];

export const workbenchPinnedTools = [
  { text: '社区公告', description: '最新通知', url: ROUTES.disclosure.announcements },
  { text: '社区投票', description: '参与决策', url: ROUTES.voting.index },
  { text: '报修投诉', description: '快速提交', url: ROUTES.services.repair },
  { text: '停车缴费', description: '账单处理', url: ROUTES.services.parking },
];

export const workbenchSections = [
  {
    title: '政务治理',
    items: [
      { title: '房屋绑定', desc: '补充或新增房屋信息', note: '资料绑定', url: ROUTES.profile.bind },
      { title: '身份认证', desc: '完成实名审核与状态查看', note: '账户安全', url: ROUTES.profile.verification },
      { title: '成员管理', desc: '管理家属、租客与共有人', note: '房屋成员', url: ROUTES.profile.members },
      { title: '社区公告', desc: '查看最新公告和物业通知', note: '公开信息', url: ROUTES.disclosure.announcements },
      { title: '财务公开', desc: '季度报告、流水与预算', note: '透明治理', url: ROUTES.disclosure.financial },
      { title: '缴费情况', desc: '账单与全区缴费概览', note: '费用公开', url: ROUTES.disclosure.payment },
      { title: '管理公开', desc: '维保记录与合同公示', note: '阳光监管', url: ROUTES.disclosure.management },
      { title: '代办申请', desc: '委托家属或代理人处理事项', note: '授权协作', url: ROUTES.services.agency },
      { title: '社区投票', desc: '正式投票与意见征集', note: '民主决策', url: ROUTES.voting.index },
    ],
  },
  {
    title: '物业服务',
    items: [
      { title: '报修投诉', desc: '提交报修、投诉和跟进记录', note: '工单中心', url: ROUTES.services.repair },
      { title: '访客通行', desc: '生成来访二维码与预约记录', note: '门岗通行', url: ROUTES.services.visitor },
      { title: '智能门禁', desc: '门禁授权与开门记录', note: '设备联动', url: ROUTES.services.access },
      { title: '快递代收', desc: '查询快递代收与取件提醒', note: '代收服务', url: ROUTES.services.parcel },
    ],
  },
  {
    title: '便捷生活',
    items: [
      { title: '停车缴费', desc: '月卡、临停与欠费明细', note: '停车服务', url: ROUTES.services.parking },
      { title: '邻里互动', desc: '邻里互助、活动与话题', note: '社区生活', url: ROUTES.services.neighbor },
      { title: '常用电话', desc: '物业、维修与紧急电话', note: '便民通讯', url: ROUTES.services.contacts },
    ],
  },
];

export const announcements = [
  {
    id: 'ann-1',
    title: '关于 2024 年第一季度物业费收支情况的公示',
    category: '财务公示',
    publisher: '锦绣花园物业服务中心',
    sourceNo: 'JXWY-2024-0318',
    date: '2024-03-18',
    content:
      '现将小区 2024 年第一季度物业费收入、公共收益和主要支出情况进行公示，详细账目可在财务公开页面查看。公示期为 7 天，如有疑问可在线提交意见。',
    views: 1240,
    isRead: false,
    important: true,
  },
  {
    id: 'ann-2',
    title: '锦绣花园电梯维保记录公示（3 月）',
    category: '管理动态',
    publisher: '锦绣花园物业工程部',
    sourceNo: 'JXGC-2024-0317',
    date: '2024-03-17',
    content:
      '本月完成全区 12 部电梯例行维保与应急演练，运行状态良好，维保单位已上传本月巡检报告和整改照片。',
    views: 856,
    isRead: true,
    important: false,
  },
  {
    id: 'ann-3',
    title: '关于清明期间文明祭扫及消防安全的通知',
    category: '社区公告',
    publisher: '锦绣花园业委会筹备组',
    sourceNo: 'JXYW-2024-0315',
    date: '2024-03-15',
    content:
      '清明期间请勿在楼道、绿化带等公共区域焚烧纸钱，物业将在重点区域加强巡查，同时延长安保值班时间。',
    views: 2100,
    isRead: false,
    important: true,
  },
  {
    id: 'ann-4',
    title: '本周六将进行二次供水水箱例行清洗',
    category: '物业通知',
    publisher: '锦绣花园物业服务中心',
    sourceNo: 'JXWY-2024-0312',
    date: '2024-03-12',
    content:
      '为保障饮用水安全，3 月 16 日将对二次供水水箱进行例行清洗，期间部分楼栋将分时段短暂停水。',
    views: 980,
    isRead: true,
    important: false,
  },
];

export const disclosureSections = [
  {
    title: '公告通知',
    desc: '社区公告、物业通知与活动预告',
    note: '今日更新',
    url: ROUTES.disclosure.announcements,
  },
  {
    title: '财务公开',
    desc: '季度收支报告、流水与预算执行',
    note: '2024 Q1',
    url: ROUTES.disclosure.financial,
  },
  {
    title: '管理公开',
    desc: '维保记录、合同公示与项目进展',
    note: '本月更新',
    url: ROUTES.disclosure.management,
  },
  {
    title: '缴费情况',
    desc: '账单、欠费与全区缴费率概览',
    note: '已缴 92.5%',
    url: ROUTES.disclosure.payment,
  },
];

export const financialReports = [
  {
    id: 'report-1',
    title: '2024 年 Q1 物业财务收支报告',
    period: '2024 年 1 月 - 3 月',
    totalIncome: 1250000,
    totalExpense: 980000,
    date: '2024-03-18',
    status: '公示中',
  },
  {
    id: 'report-2',
    title: '2023 年度公共收益结算公示',
    period: '2023 年度',
    totalIncome: 450000,
    totalExpense: 120000,
    date: '2024-01-15',
    status: '已审计',
  },
  {
    id: 'report-3',
    title: '2023 年 Q4 物业财务收支报告',
    period: '2023 年 10 月 - 12 月',
    totalIncome: 1180000,
    totalExpense: 1050000,
    date: '2024-01-10',
    status: '已审计',
  },
];

export const transactions = [
  { id: 'tx-1', title: '3 月份物业费收入', amount: 458000, date: '2024-03-15', category: '物业费', type: 'income' },
  { id: 'tx-2', title: '电梯广告位租赁收入', amount: 12500, date: '2024-03-12', category: '公共收益', type: 'income' },
  { id: 'tx-3', title: '公共区域绿化养护费', amount: -25000, date: '2024-03-10', category: '养护费', type: 'expense' },
  { id: 'tx-4', title: '保安人员季度奖金', amount: -45000, date: '2024-03-08', category: '人工成本', type: 'expense' },
  { id: 'tx-5', title: '2 月公共电费缴纳', amount: -32000, date: '2024-03-05', category: '能耗费', type: 'expense' },
  { id: 'tx-6', title: '临时停车费收入', amount: 8400, date: '2024-03-02', category: '公共收益', type: 'income' },
];

export const budgetItems = [
  { label: '日常维保', budget: 450000, spent: 120000 },
  { label: '人工成本', budget: 1200000, spent: 350000 },
  { label: '能耗支出', budget: 300000, spent: 85000 },
  { label: '绿化养护', budget: 150000, spent: 45000 },
];

export const paymentStats = {
  overallRate: 92.5,
  totalBilled: 1500000,
  totalCollected: 1387500,
  outstanding: 112500,
  monthlyTrend: [
    { month: '1 月', rate: 85 },
    { month: '2 月', rate: 88 },
    { month: '3 月', rate: 92.5 },
  ],
  myBills: [
    { title: '2024 年 3 月物业费', amount: 320.5, status: '待缴费', date: '2024-03-31' },
    { title: '2024 年 2 月物业费', amount: 320.5, status: '已缴费', date: '2024-02-15' },
    { title: '2024 年 1 月物业费', amount: 320.5, status: '已缴费', date: '2024-01-12' },
  ],
};

export const maintenanceRecords = [
  {
    id: 'maint-1',
    title: '电梯例行维保',
    date: '2024-03-17',
    status: '已完成',
    vendor: '通力电梯',
    result: '运行良好',
  },
  {
    id: 'maint-2',
    title: '二次供水水质检测',
    date: '2024-03-15',
    status: '已完成',
    vendor: '自来水公司',
    result: '符合标准',
  },
  {
    id: 'maint-3',
    title: '消防设施月度巡检',
    date: '2024-03-10',
    status: '已完成',
    vendor: '物业工程部',
    result: '无隐患',
  },
  {
    id: 'maint-4',
    title: '公共绿化补植',
    date: '2024-03-05',
    status: '进行中',
    vendor: '园林绿化公司',
    result: '施工中',
  },
];

export const votes = [
  {
    id: 'vote-1',
    title: '2024 年度物业费调整方案投票',
    type: '一户一票',
    sponsor: '业主委员会筹备组',
    scope: '全体业主',
    status: '进行中',
    endTime: '2024-04-20',
    participants: 156,
    total: 300,
    description: '根据物价上涨及人工成本变化，拟对本小区物业费进行小幅调整，请各位业主审议并参与投票。',
    options: ['同意调整', '反对调整', '弃权'],
    voted: false,
    result: [
      { label: '同意调整', percent: 58 },
      { label: '反对调整', percent: 32 },
      { label: '弃权', percent: 10 },
    ],
  },
  {
    id: 'vote-2',
    title: '社区健身器材更新意见征集',
    type: '一人一票',
    sponsor: '社区治理协商小组',
    scope: '全体居民',
    status: '进行中',
    endTime: '2024-03-30',
    participants: 45,
    total: 500,
    description: '拟在中心广场新增一批健身器材，现征集居民对器材类型和摆放位置的偏好。',
    options: ['力量训练区', '有氧运动区', '儿童活动区', '综合训练区'],
    voted: false,
    result: [
      { label: '力量训练区', percent: 28 },
      { label: '有氧运动区', percent: 24 },
      { label: '儿童活动区', percent: 30 },
      { label: '综合训练区', percent: 18 },
    ],
  },
  {
    id: 'vote-3',
    title: '关于实行垃圾分类定时定点投放的决议',
    type: '一户一票',
    sponsor: '物业服务中心',
    scope: '全体业主',
    status: '已结束',
    endTime: '2024-02-15',
    participants: 280,
    total: 300,
    description: '为推进绿色社区建设，拟在小区内全面实行垃圾分类定时定点投放，请业主表决。',
    options: ['支持', '不支持'],
    voted: true,
    result: [
      { label: '支持', percent: 83 },
      { label: '不支持', percent: 17 },
    ],
  },
];

export const currentUser = {
  name: '张康',
  community: '锦绣花园',
  id: '8829301',
};

export const profileHouses = [
  {
    id: 'house-1',
    name: '3号楼 1202',
    role: '业主',
    memberCount: 4,
  },
];

export const members = [
  {
    id: 'member-1',
    name: '张康',
    role: '业主',
    phone: '138****8888',
    status: 'active',
    joinDate: '2023-05-12',
  },
  {
    id: 'member-2',
    name: '李梅',
    role: '家属',
    phone: '139****1234',
    status: 'active',
    joinDate: '2023-05-15',
  },
  {
    id: 'member-3',
    name: '张小明',
    role: '家属',
    phone: '未绑定',
    status: 'active',
    joinDate: '2023-06-01',
  },
  {
    id: 'member-4',
    name: '王大锤',
    role: '租客',
    phone: '150****5678',
    status: 'pending',
    joinDate: '2024-03-10',
  },
];

export const permissionItems = [
  {
    key: 'tenantVote',
    title: '允许租客参与投票',
    desc: '开启后，租客可参与社区议题投票',
    value: false,
  },
  {
    key: 'familyPay',
    title: '允许家属代缴费用',
    desc: '开启后，家属可查看并缴纳物业费',
    value: true,
  },
  {
    key: 'tenantPay',
    title: '允许租客自主缴费',
    desc: '开启后，租客可查看并缴纳账单',
    value: true,
  },
  {
    key: 'guestAccess',
    title: '允许访客预约',
    desc: '开启后，非业主成员也可发起访客预约',
    value: false,
  },
];

export const verificationRecord = {
  status: 'verified',
  name: '张康',
  idNo: '4403**********1234',
  verifiedAt: '2023-05-10',
};

export const aiSuggestions = [
  '帮我解读这个季度的物业收支情况',
  '我想发起一个健身器材征集投票',
  '报修提交后一般多久可以处理',
];

export const contacts = [
  { title: '物业服务中心', phone: '400-800-1200', note: '8:30 - 18:00' },
  { title: '夜间值班电话', phone: '138-0000-1024', note: '18:00 - 次日 8:30' },
  { title: '消防应急协助', phone: '119', note: '紧急情况直接拨打' },
  { title: '电梯维保单位', phone: '021-12345678', note: '24 小时值守' },
];
