import { ROUTES } from '../../../constants/routes';
import {
  fetchDisclosureContents,
  formatDisclosureDate,
  getDisclosureDisplayDate,
  PublicDisclosureContentItem,
} from '../../../services/disclosure';
import { bootstrapWechatSession } from '../../../services/session';
import { CurrentHouseProfile, CurrentUserDetail, fetchCurrentUser } from '../../../services/user';
import { fetchVotes } from '../../../services/vote';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

interface DisclosureSectionItem {
  key: string;
  title: string;
  url: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  requiresHouse: boolean;
}

interface LatestAnnouncementItem extends PublicDisclosureContentItem {
  displayDate: string;
}

interface VoteGuideCard {
  title: string;
  buttonText: string;
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

interface BoundHouseOption {
  id: string;
  houseName: string;
  fullName: string;
  buildingName: string;
  roleLabel: string;
  statusTag: string | null;
  subtitle: string;
  isCurrent: boolean;
}

const relationTypeLabelMap: Record<string, string> = {
  MAIN_OWNER: '业主',
  FAMILY_MEMBER: '家属',
  MAIN_TENANT: '租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代理人',
};

const memberStatusLabelMap: Record<string, string> = {
  ACTIVE: '已绑定',
  PENDING: '待审核',
  REJECTED: '未通过',
  REMOVED: '已移除',
};

const sections: DisclosureSectionItem[] = [
  {
    key: 'vote',
    title: '投票表决',
    url: ROUTES.voting.index,
    icon: 'check-circle',
    iconColor: '#2f6bff',
    iconBackground: '#eaf1ff',
    requiresHouse: true,
  },
  {
    key: 'notice',
    title: '公告通知',
    url: ROUTES.disclosure.announcements,
    icon: 'notification',
    iconColor: '#2f6bff',
    iconBackground: '#eaf1ff',
    requiresHouse: false,
  },
  {
    key: 'financial',
    title: '财务公开',
    url: ROUTES.disclosure.financial,
    icon: 'home',
    iconColor: '#1f9d55',
    iconBackground: '#e9f9ef',
    requiresHouse: false,
  },
  {
    key: 'management',
    title: '管理公开',
    url: ROUTES.disclosure.management,
    icon: 'setting',
    iconColor: '#f08c00',
    iconBackground: '#fff4e5',
    requiresHouse: false,
  },
  {
    key: 'payment',
    title: '收费公开',
    url: ROUTES.disclosure.payment,
    icon: 'time',
    iconColor: '#8b5cf6',
    iconBackground: '#f3edff',
    requiresHouse: false,
  },
  {
    key: 'repair',
    title: '报修反馈',
    url: ROUTES.services.repair,
    icon: 'tools',
    iconColor: '#f08c00',
    iconBackground: '#fff4e5',
    requiresHouse: true,
  },
  {
    key: 'access',
    title: '门禁通行',
    url: ROUTES.services.access,
    icon: 'secured',
    iconColor: '#2f6bff',
    iconBackground: '#eaf1ff',
    requiresHouse: true,
  },
  {
    key: 'visitor',
    title: '访客登记',
    url: ROUTES.services.visitor,
    icon: 'user-add',
    iconColor: '#1f9d55',
    iconBackground: '#e9f9ef',
    requiresHouse: true,
  },
];

function mapAnnouncement(item: PublicDisclosureContentItem): LatestAnnouncementItem {
  return {
    ...item,
    displayDate: formatDisclosureDate(getDisclosureDisplayDate(item)),
  };
}

function createDefaultVoteGuideCard(): VoteGuideCard {
  return {
    title: '当前暂无进行中的投票',
    buttonText: '查看投票',
  };
}

function createVoteGuideCard(count: number): VoteGuideCard {
  if (count > 0) {
    return {
      title: `当前有 ${count} 个投票进行中`,
      buttonText: '去参与',
    };
  }

  return createDefaultVoteGuideCard();
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

function createDefaultBoundHouseOption(): BoundHouseOption[] {
  return [];
}

function buildBoundHouseOptions(user: CurrentUserDetail): BoundHouseOption[] {
  const currentHouseId = user.currentHouseProfile.houseId || '';
  const communityName = user.currentHouseProfile.communityName || '已绑定房屋';

  return user.houseRelations.map((item) => {
    const roleLabel =
      relationTypeLabelMap[item.relationLabel?.toUpperCase?.() || ''] ||
      item.relationLabel ||
      '住户';
    const isCurrent = Boolean(currentHouseId) && currentHouseId === item.houseId;
    const statusTag = isCurrent && user.currentHouseProfile.isVerified
      ? '已认证'
      : memberStatusLabelMap[item.status] || '已绑定';

    return {
      id: item.houseId || item.id,
      houseName: item.houseDisplayName || '未命名房屋',
      fullName: `${communityName}·${item.houseDisplayName || '未命名房屋'}`,
      buildingName: item.buildingName || '当前楼栋',
      roleLabel,
      statusTag,
      subtitle: `${item.buildingName || '当前楼栋'} · ${statusTag}`,
      isCurrent,
    };
  });
}

function buildCardStats(profile: CurrentHouseProfile | null | undefined, selectedHouse: BoundHouseOption | null) {
  if (selectedHouse?.isCurrent && profile?.houseDisplayName) {
    return [
      { label: '房屋成员', value: String(profile.memberCount || 0) },
      { label: '缴费权限', value: profile.canPayBill ? '已开通' : '未开通' },
      { label: '参与咨询', value: profile.canJoinConsultation ? '可参与' : '未开通' },
    ];
  }

  if (selectedHouse) {
    return [
      { label: '所在楼栋', value: selectedHouse.buildingName || '--' },
      { label: '绑定状态', value: selectedHouse.statusTag || '已绑定' },
      { label: '身份角色', value: selectedHouse.roleLabel || '住户' },
    ];
  }

  return createDefaultHomeProfileCard().stats;
}

function mapHomeProfileCard(
  profile: CurrentHouseProfile | null | undefined,
  selectedHouse: BoundHouseOption | null,
): HomeProfileCard {
  if (!selectedHouse) {
    return createDefaultHomeProfileCard();
  }

  return {
    houseName: selectedHouse.houseName,
    houseRole: selectedHouse.roleLabel,
    statusTag: selectedHouse.statusTag,
    communityName: profile?.communityName || '已绑定房屋',
    subtitle: selectedHouse.subtitle,
    stats: buildCardStats(profile, selectedHouse),
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
    voteGuideCard: createDefaultVoteGuideCard(),
    latestAnnouncements: [] as LatestAnnouncementItem[],
    hasBoundHouse: false,
    houseSwitcherVisible: false,
    selectedHouseId: '',
    boundHouses: createDefaultBoundHouseOption(),
    loadingVoteGuide: false,
    loadingLatest: false,
  },

  lifetimes: {
    attached() {
      void this.loadHomeProfile();
      void this.loadVoteGuide();
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
            boundHouses: createDefaultBoundHouseOption(),
            selectedHouseId: '',
            hasBoundHouse: false,
          });
          return;
        }

        const user = await fetchCurrentUser();
        const boundHouses = buildBoundHouseOptions(user);
        const selectedHouse = boundHouses.find((item) => item.isCurrent) || boundHouses[0] || null;

        this.setData({
          homeProfileCard: mapHomeProfileCard(user.currentHouseProfile, selectedHouse),
          boundHouses,
          selectedHouseId: selectedHouse?.id || '',
          hasBoundHouse: boundHouses.length > 0,
        });
      } catch (error) {
        console.error('load current user profile failed', error);
        this.setData({
          homeProfileCard: createDefaultHomeProfileCard(),
          boundHouses: createDefaultBoundHouseOption(),
          selectedHouseId: '',
          hasBoundHouse: false,
        });
      }
    },

    async loadVoteGuide() {
      this.setData({
        loadingVoteGuide: true,
      });

      try {
        const result = await fetchVotes({
          page: 1,
          pageSize: 1,
          status: 'ONGOING',
        });

        this.setData({
          voteGuideCard: createVoteGuideCard(result.total || 0),
        });
      } catch (error) {
        console.error('load vote guide failed', error);
        this.setData({
          voteGuideCard: createDefaultVoteGuideCard(),
        });
      } finally {
        this.setData({
          loadingVoteGuide: false,
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
      const { url, requiresHouse } = event.currentTarget.dataset as {
        url?: string;
        requiresHouse?: boolean;
      };

      if (!url) {
        return;
      }

      if (requiresHouse && !this.data.hasBoundHouse) {
        wx.showToast({
          title: '请先绑定房屋',
          icon: 'none',
        });
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

    openHouseSwitcher() {
      this.setData({
        houseSwitcherVisible: true,
      });
    },

    handleHouseSwitcherVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
      this.setData({
        houseSwitcherVisible: !!event.detail.visible,
      });
    },

    closeHouseSwitcher() {
      this.setData({
        houseSwitcherVisible: false,
      });
    },

    async handleSelectHouse(event: WechatMiniprogram.BaseEvent) {
      const { id } = event.currentTarget.dataset as { id?: string };
      if (!id) {
        return;
      }

      const { boundHouses, selectedHouseId } = this.data;
      if (selectedHouseId === id) {
        this.setData({ houseSwitcherVisible: false });
        return;
      }

      const selectedHouse = boundHouses.find((item) => item.id === id) || null;
      if (!selectedHouse) {
        return;
      }

      try {
        const hasSession = await bootstrapWechatSession();
        if (!hasSession || !appStore.hasAccessToken()) {
          this.setData({
            houseSwitcherVisible: false,
          });
          return;
        }

        const user = await fetchCurrentUser();

        this.setData({
          selectedHouseId: id,
          homeProfileCard: mapHomeProfileCard(user.currentHouseProfile, selectedHouse),
          houseSwitcherVisible: false,
        });
      } catch (error) {
        console.error('switch home card house failed', error);
      }
    },

    handleBindNewHouse() {
      this.setData({
        houseSwitcherVisible: false,
      });
      navigateTo(ROUTES.register);
    },

    openVoteGuide() {
      navigateTo(ROUTES.voting.index);
    },
  },
});
