export const ROUTES = {
  home: '/pages/home/index',
  auth: {
    login: '/pages/auth/login/index',
    identitySelect: '/pages/auth/identity-select/index',
    rules: '/pages/auth/rules/index',
    ownerSubmit: '/pages/auth/owner-submit/index',
    tenantSubmit: '/pages/auth/tenant-submit/index',
    committeeSubmit: '/pages/auth/committee-submit/index',
    result: '/pages/auth/result/index',
  },
  house: {
    list: '/pages/house/list/index',
    detail: '/pages/house/detail/index',
    switch: '/pages/house/switch/index',
  },
  member: {
    manage: '/pages/member/manage/index',
    add: '/pages/member/add/index',
    detail: '/pages/member/detail/index',
    voteRepresentative: '/pages/member/vote-representative/index',
  },
  vote: {
    list: '/pages/vote/list/index',
    detail: '/pages/vote/detail/index',
    join: '/pages/vote/join/index',
    result: '/pages/vote/result/index',
  },
  publicity: {
    index: '/pages/publicity/index',
    announcementList: '/pages/publicity/announcement-list/index',
    announcementDetail: '/pages/publicity/announcement-detail/index',
    disclosureList: '/pages/publicity/disclosure-list/index',
    disclosureDetail: '/pages/publicity/disclosure-detail/index',
  },
  finance: {
    buildingList: '/pages/finance/building-list/index',
    buildingDetail: '/pages/finance/building-detail/index',
  },
  profile: {
    index: '/pages/profile/index',
  },
  message: {
    index: '/pages/message/index',
  },
} as const;
