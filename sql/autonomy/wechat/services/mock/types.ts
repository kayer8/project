export type AuthIdentityType = 'OWNER' | 'TENANT' | 'COMMITTEE';
export type AuthStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type HouseStatus = 'SELF_OCCUPIED' | 'RENTED' | 'VACANT';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REMOVED';
export type VoteStatus = 'NOT_STARTED' | 'ONGOING' | 'ENDED';
export type VoteMode = 'HOUSEHOLD' | 'PERSONAL';

export interface UserProfile {
  nickname: string;
  avatar: string;
  communityName: string;
  currentIdentityLabel: string;
  authStatus: AuthStatus;
  authStatusLabel: string;
  unreadCount: number;
}

export interface HouseMember {
  id: string;
  userName: string;
  mobileMasked: string;
  identityType: string;
  relationLabel: string;
  status: MemberStatus;
  statusLabel: string;
  isPrimaryRole: boolean;
  isVoteRepresentative: boolean;
  isPayer: boolean;
  canViewBill: boolean;
  canActAsAgent: boolean;
  canJoinConsultation: boolean;
  effectiveAt: string;
  expiredAt?: string;
  history: Array<{ time: string; content: string }>;
}

export interface HouseSummary {
  id: string;
  name: string;
  buildingName: string;
  unitNo: string;
  roomNo: string;
  status: HouseStatus;
  statusLabel: string;
  identityLabel: string;
  authStatusLabel: string;
  hasVoteRight: boolean;
  isVoteRepresentative: boolean;
  memberCount: number;
}

export interface HouseDetail extends HouseSummary {
  groupName: string;
  primaryRoleName: string;
  voteRepresentativeName: string;
  payerName: string;
  members: HouseMember[];
  notices: Array<{ id: string; title: string; time: string }>;
  votes: Array<{ id: string; title: string; statusLabel: string }>;
}

export interface VoteOption {
  id: string;
  title: string;
  description: string;
  count: number;
  ratio: string;
}

export interface VoteRecord {
  id: string;
  title: string;
  typeLabel: string;
  initiator: string;
  scopeLabel: string;
  startAt: string;
  endAt: string;
  status: VoteStatus;
  statusLabel: string;
  myStatusLabel: string;
  houseId: string;
  houseName: string;
  mode: VoteMode;
  modeLabel: string;
  canVote: boolean;
  hasVotedByHouse: boolean;
  allowRealtimeResult: boolean;
  description: string;
  rules: string[];
  options: VoteOption[];
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  category: string;
  issuer: string;
  publishedAt: string;
  isPinned: boolean;
  readCount: number;
  summary: string;
  content: string[];
}

export interface DisclosureRecord {
  id: string;
  title: string;
  category: string;
  owner: string;
  publishedAt: string;
  summary: string;
  content: string[];
  relatedBuilding?: string;
  completed: boolean;
}

export interface BuildingPaymentRecord {
  id: string;
  buildingName: string;
  month: string;
  totalHouseholds: number;
  dueHouseholds: number;
  paidHouseholds: number;
  unpaidHouseholds: number;
  paidRate: string;
  trendLabel: string;
  highlights: string[];
}

export interface MessageRecord {
  id: string;
  category: string;
  title: string;
  content: string;
  publishedAt: string;
  unread: boolean;
  targetRoute?: string;
}
