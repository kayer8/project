import { usePullDownRefresh } from '../../behaviors/usePullDownRefresh';

const props = {
  list: {
    type: Array,
    value: [],
  },
  loading: {
    type: Boolean,
    value: false,
  },
  showLoading: {
    type: Boolean,
    value: false,
  },
  finished: {
    type: Boolean,
    value: false,
  },
  isLoadMore: {
    type: Boolean,
    value: false,
  },
  useEmptySlot: {
    type: Boolean,
    value: false,
  },
  enableRefresh: {
    type: Boolean,
    value: true,
  },
  enableLoadMore: {
    type: Boolean,
    value: true,
  },
  emptyDescription: {
    type: String,
    value: '暂无数据',
  },
  loadingText: {
    type: String,
    value: '加载中...',
  },
  finishedText: {
    type: String,
    value: '没有更多了',
  },
  lowerThreshold: {
    type: Number,
    value: 80,
  },
  style: {
    type: String,
    value: '',
  },
};

Component({
  properties: props,
  behaviors: [usePullDownRefresh],
  data: {
    scrollTop: 0,
  },
  options: {
    multipleSlots: true,
    virtualHost: true,
  },
  externalClasses: ['class', 'content-class'],

  methods: {
    onScrollToLower() {
      const { finished, loading, isLoadMore, enableLoadMore } = this.properties;

      if (!enableLoadMore || finished || loading || isLoadMore) {
        return;
      }

      this.triggerEvent('loadMore');
    },

    onScroll(e: WechatMiniprogram.CustomEvent<{ scrollTop: number }>) {
      const { scrollTop } = e.detail;
      this.setData({ scrollTop });
      this.triggerEvent('scroll', { scrollTop });
    },

    onRefresh() {
      const instance = this as unknown as WechatMiniprogram.Component.TrivialInstance & {
        startPullDownRefresh: () => void;
        stopPullDownRefresh: () => void;
      };
      const { enableRefresh, loading, isLoadMore } = this.properties;

      if (!enableRefresh || loading || isLoadMore) {
        instance.stopPullDownRefresh();
        return;
      }

      instance.startPullDownRefresh();
      this.triggerEvent('refresh', {
        done: () => instance.stopPullDownRefresh(),
      });
    },
  },
});
