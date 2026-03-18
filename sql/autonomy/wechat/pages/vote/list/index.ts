import { ROUTES } from '../../../constants/routes';
import { getVotes } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

type VoteFilterKey = 'ALL' | 'ONGOING' | 'ENDED' | 'MINE';

const tabs: Array<{ key: VoteFilterKey; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'ONGOING', label: '进行中' },
  { key: 'ENDED', label: '已结束' },
  { key: 'MINE', label: '我的房屋' },
];

Page({
  data: {
    tabs,
    activeTab: 'ALL' as VoteFilterKey,
    keyword: '',
    votes: getVotes(),
  },

  onShow() {
    this.loadVotes();
  },

  loadVotes() {
    const activeTab = this.data.activeTab;
    const keyword = this.data.keyword.trim();
    const source = activeTab === 'ALL' ? getVotes() : getVotes(activeTab === 'MINE' ? 'MINE' : activeTab);
    const votes = keyword ? source.filter((item) => item.title.includes(keyword)) : source;
    this.setData({ votes });
  },

  handleTabChange(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key: VoteFilterKey };
    this.setData({ activeTab: key }, () => this.loadVotes());
  },

  handleKeywordInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ keyword: event.detail.value }, () => this.loadVotes());
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.vote.detail, { id });
  },

  handleCreateVote() {
    wx.showToast({ title: '发起投票功能待接真实接口', icon: 'none' });
  },
});
