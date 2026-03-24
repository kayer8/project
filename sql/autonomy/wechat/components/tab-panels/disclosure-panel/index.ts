import { ROUTES } from '../../../constants/routes';
import {
  fetchDisclosureContents,
  formatDisclosureDate,
  getDisclosureDisplayDate,
  PublicDisclosureContentItem,
} from '../../../services/disclosure';
import { CurrentHouseProfile, fetchCurrentUser } from '../../../services/user';
import { bootstrapWechatSession } from '../../../services/session';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

interface DisclosureSectionItem {
  title: string;
  url: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
}

interface LatestAnnouncementItem extends PublicDisclosureContentItem {
  displayDate: string;
}

interface HomeProfileCardAction {
  title: string;
  url: string;
  theme: 'secondary' | 'primary';
}

interface HomeProfileCardStat {
  label: string;
  value: string;
}

interface HomeProfileCard {
  houseName: string;
  houseRole: string | null;
  statusTag: string | null;
  communityName: string;
  subtitle: string;
  stats: HomeProfileCardStat[];
  actions: HomeProfileCardAction[];
}

const relationTypeLabelMap: Record<string, string> = {
  MAIN_OWNER: '业主',
  FAMILY_MEMBER: '家属',
  MAIN_TENANT: '租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代理人',
};

const sections: DisclosureSectionItem[] = [
  {
    title: '通知公告',
    url: ROUTES.disclosure.announcements,
    icon: 'notification',
    iconColor: '#2f6bff',
    iconBackground: '#eaf1ff',
  },
  {
    title: '财务公开',
    url: ROUTES.disclosure.financial,
    icon: 'home',
    iconColor: '#1f9d55',
    iconBackground: '#e9f9ef',
  },
  {
    title: '管理公开',
    url: ROUTES.disclosure.management,
    icon: 'setting',
    iconColor: '#f08c00',
    iconBackground: '#fff4e5',
  },
  {
    title: '收费公开',
    url: ROUTES.disclosure.payment,
    icon: 'time',
    iconColor: '#8b5cf6',
    iconBackground: '#f3edff',
  },
];

function mapAnnouncement(item: PublicDisclosureContentItem): LatestAnnouncementItem {
  return {
    ...item,
    displayDate: formatDisclosureDate(getDisclosureDisplayDate(item)),
  };
}

function createDefaultHomeProfileCard(): HomeProfileCard {
  return {
    houseName: '未绑定房屋',
    houseRole: null,
    statusTag: null,
    communityName: '暂未绑定小区',
    subtitle: '当前微信号暂无认证房屋信息',
    stats: [
      { label: '房屋成员', value: '0' },
      { label: '缴费权限', value: '未开通' },
      { label: '参与咨询', value: '待认证' },
    ],
    actions: [
      { title: '立即认证', url: ROUTES.profile.bind, theme: 'secondary' },
      { title: '个人中心', url: ROUTES.profile.index, theme: 'primary' },
    ],
  };
}

function mapHomeProfileCard(profile: CurrentHouseProfile | null | undefined): HomeProfileCard {
  if (!profile?.isVerified || !profile.houseDisplayName) {
    return createDefaultHomeProfileCard();
  }

  return {
    houseName: profile.houseDisplayName,
    houseRole: relationTypeLabelMap[profile.relationType || ''] || '住户',
    statusTag: '已认证',
    communityName: profile.communityName || '已绑定房屋',
    subtitle: `${profile.buildingName || '当前楼栋'} · 微信号已绑定房屋`,
    stats: [
      { label: '房屋成员', value: String(profile.memberCount || 0) },
      { label: '缴费权限', value: profile.canPayBill ? '已开通' : '未开通' },
      { label: '参与咨询', value: profile.canJoinConsultation ? '可参与' : '未开通' },
    ],
    actions: [
      { title: '房屋成员', url: ROUTES.profile.members, theme: 'secondary' },
      { title: '个人中心', url: ROUTES.profile.index, theme: 'primary' },
    ],
  };
}

Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    sections,
    homeProfileCard: createDefaultHomeProfileCard(),
    latestAnnouncements: [] as LatestAnnouncementItem[],
    loadingLatest: false,
  },

  lifetimes: {
    attached() {
      void this.loadHomeProfile();
      void this.loadLatestAnnouncements();
    },
  },

  methods: {
    async loadHomeProfile() {
      try {
        const hasSession = await bootstrapWechatSession();

        if (!hasSession || !appStore.hasAccessToken()) {
          this.setData({
            homeProfileCard: createDefaultHomeProfileCard(),
          });
          return;
        }

        const user = await fetchCurrentUser();

        this.setData({
          homeProfileCard: mapHomeProfileCard(user.currentHouseProfile),
        });
      } catch (error) {
        console.error('load current user profile failed', error);
        this.setData({
          homeProfileCard: createDefaultHomeProfileCard(),
        });
      }
    },

    async loadLatestAnnouncements() {
      this.setData({
        loadingLatest: true,
      });

      try {
        const result = await fetchDisclosureContents({
          category: '通知公告',
          page: 1,
          pageSize: 3,
        });
        const announcements = result.items.map(mapAnnouncement);

        this.setData({
          latestAnnouncements: announcements,
        });
      } catch (error) {
        console.error('load disclosure latest announcements failed', error);
        this.setData({
          latestAnnouncements: [],
        });
      } finally {
        this.setData({ loadingLatest: false });
      }
    },

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

    openCardAction(event: WechatMiniprogram.BaseEvent) {
      const { url } = event.currentTarget.dataset as { url?: string };

      if (!url) {
        return;
      }

      navigateTo(url);
    },
  },
});
