import { getLocalListFirstPage, getLocalListPage } from '../../../utils/list';

const mockPosts = [
  { title: '本周六广场亲子活动', note: '4 人已报名 · 社区活动' },
  { title: '求推荐靠谱的空调清洗师傅', note: '12 条回复 · 邻里互助' },
];

type NeighborPost = (typeof mockPosts)[number];

Page({
  data: {
    allPosts: mockPosts as NeighborPost[],
    posts: [] as NeighborPost[],
    loading: false,
    isLoadMore: false,
    finished: false,
    pageSize: 10,
  },

  onLoad() {
    this.applyPagedList(true);
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

  applyPagedList(reset = true, source?: NeighborPost[]) {
    const listSource = source ?? this.data.allPosts;
    const result = reset
      ? getLocalListFirstPage(listSource, this.data.pageSize)
      : getLocalListPage(listSource, this.data.posts.length, this.data.pageSize);

    this.setData({
      posts: reset ? result.items : [...this.data.posts, ...result.items],
      finished: result.finished,
    });
  },
});
