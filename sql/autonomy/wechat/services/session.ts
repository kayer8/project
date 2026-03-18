import { ROUTES } from '../constants/routes';
import { appStore, type SessionUser } from '../store/app';
import { fetchMyHouses, type MyHouseSummary } from './house';
import { fetchCurrentUser, type CurrentUserDetail } from './user';

const authStatusLabelMap: Record<string, string> = {
  APPROVED: '已认证',
  PENDING: '审核中',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回',
  SUPPLEMENT_REQUIRED: '待补充',
};

export interface SessionProfileView {
  nickname: string;
  avatar: string;
  communityName: string;
  currentIdentityLabel: string;
  authStatusLabel: string;
  unreadCount: number;
}

export interface SessionCurrentHouseView {
  id: string;
  name: string;
  buildingName: string;
  unitNo: string;
  roomNo: string;
  groupName: string;
  memberCount: number;
  hasVoteRight: boolean;
  isVoteRepresentative: boolean;
}

export interface SessionDashboard {
  user: CurrentUserDetail;
  houses: MyHouseSummary[];
  profile: SessionProfileView;
  currentHouse: SessionCurrentHouseView | null;
}

function pickCurrentHouse(houses: MyHouseSummary[]) {
  const currentHouseId = appStore.getCurrentHouseId();
  const house = houses.find((item) => item.houseId === currentHouseId) || houses[0] || null;

  if (house) {
    appStore.setCurrentHouseId(house.houseId);
    appStore.setCurrentRole(house.relationLabel || '');
  } else {
    appStore.setCurrentHouseId('');
    appStore.setCurrentRole('');
  }

  return house;
}

function getAuthStatusLabel(user: CurrentUserDetail) {
  const latestApplication = user.identityApplications[0];

  if (latestApplication?.status) {
    return authStatusLabelMap[latestApplication.status] || latestApplication.status;
  }

  if (user.houseRelations.length > 0) {
    return '已认证';
  }

  return '未认证';
}

function toSessionUser(user: CurrentUserDetail): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname || user.realName || '微信用户',
    avatarUrl: user.avatarUrl ?? null,
    mobile: user.mobile ?? null,
    realName: user.realName ?? null,
  };
}

function buildProfile(user: CurrentUserDetail, currentHouse: MyHouseSummary | null): SessionProfileView {
  return {
    nickname: user.realName || user.nickname || '微信用户',
    avatar: user.avatarUrl || '',
    communityName: user.communityRoles[0]?.communityName || '物业自治社区',
    currentIdentityLabel:
      currentHouse?.relationLabel ||
      user.houseRelations[0]?.relationLabel ||
      '未认证用户',
    authStatusLabel: getAuthStatusLabel(user),
    unreadCount: 0,
  };
}

function buildCurrentHouse(house: MyHouseSummary | null): SessionCurrentHouseView | null {
  if (!house) {
    return null;
  }

  return {
    id: house.houseId,
    name: house.displayName,
    buildingName: house.buildingName,
    unitNo: house.unitNo,
    roomNo: house.roomNo,
    groupName: house.activeHouseholdType || '暂无住户组',
    memberCount: house.memberCount,
    hasVoteRight: house.isPrimaryRole,
    isVoteRepresentative: house.isPrimaryRole,
  };
}

export function ensureAuthenticated() {
  if (appStore.hasAccessToken()) {
    return true;
  }

  wx.navigateTo({ url: ROUTES.auth.login });
  return false;
}

export async function hydrateSessionDashboard(): Promise<SessionDashboard> {
  const [user, houses] = await Promise.all([fetchCurrentUser(), fetchMyHouses()]);
  const currentHouse = pickCurrentHouse(houses);

  appStore.setSessionUser(toSessionUser(user));

  return {
    user,
    houses,
    profile: buildProfile(user, currentHouse),
    currentHouse: buildCurrentHouse(currentHouse),
  };
}
