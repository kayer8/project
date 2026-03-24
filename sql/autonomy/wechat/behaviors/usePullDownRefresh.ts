import { PULLDOWN_LOADING_PROPS } from '../constants/props';

export const usePullDownRefresh = Behavior({
  data: {
    isRefreshing: false,
    PULL_DOWN_LOADING_PROPS: PULLDOWN_LOADING_PROPS,
  },

  methods: {
    /**
     * 开始下拉刷新
     */
    startPullDownRefresh() {
      this.setData({
        isRefreshing: true,
      });
    },

    /**
     * 停止下拉刷新
     */
    stopPullDownRefresh() {
      this.setData({
        isRefreshing: false,
      });
    },
  },
});
