export type AdminMenuIcon = 'home';

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
    title: 'Overview',
    items: [
      {
        title: 'Home',
        path: '/',
        matchPrefix: '/',
        icon: 'home',
      },
    ],
  },
];

export const flatMenuItems = menuGroups.flatMap((group) => group.items);
