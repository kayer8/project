import { ROUTES } from '../../../constants/routes';
import { announcements, disclosureSections } from '../../../mock/community';
import { navigateTo } from '../../../utils/nav';

const sectionMetaMap = {
  公告通知: { icon: 'notification', tagTheme: 'primary' },
  财务公开: { icon: 'home', tagTheme: 'primary' },
  管理公开: { icon: 'setting', tagTheme: 'primary' },
  缴费情况: { icon: 'time', tagTheme: 'success' },
} as const;

Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    sections: disclosureSections.map((item) => ({
      ...item,
      icon: sectionMetaMap[item.title as keyof typeof sectionMetaMap]?.icon || 'view-list',
      tagTheme: sectionMetaMap[item.title as keyof typeof sectionMetaMap]?.tagTheme || 'primary',
    })),
    latestAnnouncements: announcements.slice(0, 3),
    latestUpdate: announcements[0]?.date || '',
    publishersLabel: '业委会 / 物业',
  },

  methods: {
    openDetail(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id?: string };

      if (!id) {
        return;
      }

      navigateTo(ROUTES.disclosure.detail, { id });
    },

    openSection(event: WechatMiniprogram.BaseEvent) {
      const { url } = event.currentTarget.dataset as { url?: string };

      if (!url) {
        return;
      }

      navigateTo(url);
    },
  },
});
