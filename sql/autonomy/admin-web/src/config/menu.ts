export type AdminMenuIcon =
  | 'vote'
  | 'vote-result'
  | 'disclosure'
  | 'publish'
  | 'management-fee'
  | 'house'
  | 'building'
  | 'member'
  | 'review'
  | 'owner'
  | 'setting';

export interface AdminMenuItem {
  title: string;
  path: string;
  matchPrefix: string;
  icon: AdminMenuIcon;
}

export interface AdminMenuGroup {
  title: string;
  items: AdminMenuItem[];
}

export const menuGroups: AdminMenuGroup[] = [
  {
    title: '投票管理',
    items: [
      {
        title: '投票列表',
        path: '/votes/list',
        matchPrefix: '/votes/list',
        icon: 'vote',
      },
      {
        title: '投票结果',
        path: '/votes/results',
        matchPrefix: '/votes/results',
        icon: 'vote-result',
      },
    ],
  },
  {
    title: '信息公开',
    items: [
      {
        title: '内容管理',
        path: '/disclosures/content',
        matchPrefix: '/disclosures/content',
        icon: 'disclosure',
      },
      {
        title: '管理费公开',
        path: '/disclosures/management-fees',
        matchPrefix: '/disclosures/management-fees',
        icon: 'management-fee',
      },
    ],
  },
  {
    title: '房屋管理',
    items: [
      {
        title: '房屋数据',
        path: '/houses/list',
        matchPrefix: '/houses',
        icon: 'house',
      },
      {
        title: '楼栋管理',
        path: '/buildings/list',
        matchPrefix: '/buildings',
        icon: 'building',
      },
      {
        title: '成员关系',
        path: '/members/list',
        matchPrefix: '/members',
        icon: 'member',
      },
    ],
  },
  {
    title: '业主管理',
    items: [
      {
        title: '认证审核',
        path: '/owners/reviews',
        matchPrefix: '/owners/reviews',
        icon: 'review',
      },
      {
        title: '业主列表',
        path: '/owners/list',
        matchPrefix: '/owners/list',
        icon: 'owner',
      },
    ],
  },
  {
    title: '系统设置',
    items: [
      {
        title: '操作记录',
        path: '/disclosures/publish-records',
        matchPrefix: '/disclosures/publish-records',
        icon: 'publish',
      },
      {
        title: '系统设置',
        path: '/settings',
        matchPrefix: '/settings',
        icon: 'setting',
      },
    ],
  },
];

export const flatMenuItems = menuGroups.flatMap((group) => group.items);
