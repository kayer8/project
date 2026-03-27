import { ROUTES } from '../../../constants/routes';
import { bootstrapWechatSession } from '../../../services/session';
import {
  fetchMyVotes,
  formatVoteDeadline,
  formatVoteStatus,
  formatVoteType,
  VoteItem,
} from '../../../services/vote';
import { appStore } from '../../../store/app';
import { navigateTo } from '../../../utils/nav';

interface VoteRecordItem extends VoteItem {
  typeLabel: string;
  statusLabel: string;
  deadlineLabel: string;
  selectedOptionText: string;
}

function mapVoteRecord(item: VoteItem): VoteRecordItem {
  const selectedOption = item.options.find((option) => option.id === item.selectedOptionId);

  return {
    ...item,
    typeLabel: formatVoteType(item.type),
    statusLabel: formatVoteStatus(item.status),
    deadlineLabel: formatVoteDeadline(item.deadline),
    selectedOptionText: selectedOption?.optionText || '未找到已投选项',
  };
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '投票记录加载失败';
}

Page({
  data: {
    votes: [] as VoteRecordItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    errorMessage: '',
    page: 1,
    pageSize: 10,
  },

  onLoad() {
    void this.loadVotes(true);
  },

  async loadVotes(reset = false) {
    const nextPage = reset ? 1 : this.data.page + 1;

    this.setData({
      loading: reset,
      isLoadMore: !reset,
      errorMessage: '',
    });

    try {
      const hasSession = await bootstrapWechatSession();

      if (!hasSession || !appStore.hasAccessToken()) {
        this.setData({
          votes: [],
          page: 1,
          finished: true,
          errorMessage: '请先登录后查看投票记录',
        });
        return;
      }

      const result = await fetchMyVotes({
        page: nextPage,
        pageSize: this.data.pageSize,
        houseId: appStore.getSelectedHouseId() || undefined,
      });
      const nextItems = result.items.map(mapVoteRecord);

      this.setData({
        votes: reset ? nextItems : [...this.data.votes, ...nextItems],
        page: result.page,
        finished: result.page * result.pageSize >= result.total,
      });
    } catch (error) {
      this.setData({
        errorMessage: resolveErrorMessage(error),
        ...(reset
          ? {
              votes: [],
              page: 1,
              finished: true,
            }
          : {}),
      });
    } finally {
      this.setData({
        loading: false,
        isLoadMore: false,
      });
    }
  },

  openVoteDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.voting.detail, {
      id,
      mine: 1,
      houseId: appStore.getSelectedHouseId() || undefined,
    });
  },

  onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    void this.loadVotes(true).finally(() => {
      event?.detail?.done?.();
    });
  },

  onListLoadMore() {
    if (this.data.finished || this.data.isLoadMore || this.data.loading) {
      return;
    }

    void this.loadVotes(false);
  },
});
