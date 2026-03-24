import { ROUTES } from '../../../constants/routes';
import { members as mockMembers } from '../../../mock/community';
import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';
import { navigateTo } from '../../../utils/nav';

type MemberItem = (typeof mockMembers)[number];

Page({
  data: {
    allMembers: [...mockMembers] as MemberItem[],
    members: [] as MemberItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    pageSize: 10,
  },

  onLoad() {
    this.applyPagedList(true);
  },

  openInvite() {
    navigateTo(ROUTES.profile.invite);
  },

  openPermissions() {
    navigateTo(ROUTES.profile.permissions);
  },

  handleRemove(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    const nextMembers = this.data.allMembers.filter((item) => item.id !== id);
    this.setData({ allMembers: nextMembers });
    this.applyPagedList(true, nextMembers);
  },

  onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    this.applyPagedList(true);
    event?.detail?.done?.();
  },

  onListLoadMore() {
    if (this.data.finished || this.data.isLoadMore) {
      return;
    }

    this.setData({ isLoadMore: true });
    this.applyPagedList(false);
    this.setData({ isLoadMore: false });
  },

  applyPagedList(reset = true, source?: MemberItem[]) {
    const listSource = source ?? this.data.allMembers;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.members.length, this.data.pageSize);

    this.setData({
      members: reset ? result.items : [...this.data.members, ...result.items],
      finished: result.finished,
    });
  },
});
