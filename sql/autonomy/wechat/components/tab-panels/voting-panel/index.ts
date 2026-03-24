import { ROUTES } from '../../../constants/routes';
import {
  fetchVotes,
  formatVoteDeadline,
  formatVoteStatus,
  formatVoteType,
  VoteItem,
  VoteType,
} from '../../../services/vote';
import { navigateTo } from '../../../utils/nav';

interface VoteCardItem extends VoteItem {
  typeLabel: string;
  statusLabel: string;
  deadlineLabel: string;
}

function mapVoteCard(item: VoteItem): VoteCardItem {
  return {
    ...item,
    typeLabel: formatVoteType(item.type),
    statusLabel: formatVoteStatus(item.status),
    deadlineLabel: formatVoteDeadline(item.deadline),
  };
}

Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    votes: [] as VoteCardItem[],
    loading: false,
    isLoadMore: false,
    finished: false,
    errorMessage: '',
    page: 1,
    pageSize: 10,
  },

  lifetimes: {
    attached() {
      void this.loadVotes(true);
    },
  },

  methods: {
    async loadVotes(reset = false) {
      const nextPage = reset ? 1 : this.data.page + 1;

      this.setData({
        loading: reset,
        isLoadMore: !reset,
        errorMessage: '',
      });

      try {
        const result = await fetchVotes({
          page: nextPage,
          pageSize: this.data.pageSize,
        });
        const nextItems = result.items.map(mapVoteCard);

        this.setData({
          votes: reset ? nextItems : [...this.data.votes, ...nextItems],
          page: result.page,
          finished: result.page * result.pageSize >= result.total,
        });
      } catch (error) {
        this.setData({
          errorMessage: error instanceof Error ? error.message : '投票列表加载失败',
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

      navigateTo(ROUTES.voting.detail, { id });
    },

    openCreateVote(event: WechatMiniprogram.BaseEvent) {
      const { type } = event.currentTarget.dataset as { type?: VoteType };
      navigateTo(ROUTES.voting.create, type ? { type } : undefined);
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
  },
});
