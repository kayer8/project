import EventEmitter from '../utils/EventEmitter';

export interface TransformedListData<T> {
  data: T[];
  finished: boolean;
  total: number;
}

interface UseListOptions<U, T, R> {
  query: (offset: number, query: U | undefined) => Promise<T> | T;
  transform: (data: T) => TransformedListData<R>;
  selectId?: (item: R) => string | number;
  immediate?: boolean;
}

type FetchType = 'init' | 'refresh' | 'pagination';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '列表加载失败';
}

export function useList<U, T, R>(options: UseListOptions<U, T, R>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { query, transform, immediate = true, selectId = (item) => (item as any).id } = options;
  let payload: U | undefined;
  let unsubscribe: (() => void) | undefined;
  let requestToken = 0;
  const emitter = new EventEmitter<{
    'list:fetch:success': [type: FetchType, data: T];
  }>();

  async function fetchPage(type: FetchType, offset = 0) {
    const result = await query(offset, payload);
    const transformed = transform(result);
    emitter.emit('list:fetch:success', type, result);
    return transformed;
  }

  return Behavior({
    data: {
      list: {
        data: [] as R[],
        finished: false,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        initialized: false,
        total: 0,
        errorMessage: '',
      },
    },

    lifetimes: {
      ready() {
        if (immediate) {
          void this.onListInit();
        }
      },

      detached() {
        unsubscribe?.();
      },
    },

    methods: {
      onListLoaded(callback: (type: FetchType, result: T) => void) {
        emitter.on('list:fetch:success', callback);
        unsubscribe = () => {
          emitter.off('list:fetch:success', callback);
        };
      },

      getListQuery() {
        return payload;
      },

      setListQuery(queryPayload?: U) {
        payload = queryPayload;
      },

      resetListState() {
        requestToken += 1;
        this.setData({
          'list.data': [],
          'list.finished': false,
          'list.isLoading': false,
          'list.isLoadingMore': false,
          'list.isRefreshing': false,
          'list.initialized': false,
          'list.total': 0,
          'list.errorMessage': '',
        });
      },

      async onListInit(queryPayload?: U, options?: { keepData?: boolean; silent?: boolean }) {
        const { keepData = false, silent = false } = options || {};
        const { list } = this.data;

        if (list.isLoading || list.isRefreshing || list.isLoadingMore) {
          return;
        }

        if (arguments.length > 0) {
          payload = queryPayload;
        }

        const previousData = list.data;
        const currentToken = ++requestToken;

        this.setData({
          'list.isLoading': !silent,
          'list.initialized': true,
          'list.errorMessage': '',
          ...(keepData ? {} : { 'list.data': [], 'list.finished': false, 'list.total': 0 }),
        });

        try {
          const result = await fetchPage('init');

          if (currentToken !== requestToken) {
            return;
          }

          this.setData({
            'list.data': result.data,
            'list.finished': result.finished,
            'list.total': result.total,
            'list.errorMessage': '',
          });

          return result;
        } catch (error) {
          if (currentToken === requestToken) {
            this.setData({
              'list.data': previousData,
              'list.errorMessage': getErrorMessage(error),
            });
          }

          throw error;
        } finally {
          if (currentToken === requestToken && !silent) {
            this.setData({
              'list.isLoading': false,
            });
          }
        }
      },

      async onListLoadMore() {
        const { list } = this.data;

        if (list.isLoading || list.isLoadingMore || list.isRefreshing || list.finished) {
          return;
        }

        if (list.total > 0 && list.data.length >= list.total) {
          this.setData({ 'list.finished': true });
          return;
        }

        const currentToken = ++requestToken;

        try {
          this.setData({
            'list.isLoadingMore': true,
            'list.errorMessage': '',
          });

          const result = await fetchPage('pagination', list.data.length);

          if (currentToken !== requestToken) {
            return;
          }

          this.setData({
            'list.data': [...list.data, ...result.data],
            'list.finished': result.finished,
            'list.total': result.total,
          });

          return result;
        } catch (error) {
          if (currentToken === requestToken) {
            this.setData({
              'list.errorMessage': getErrorMessage(error),
            });
          }

          throw error;
        } finally {
          if (currentToken === requestToken) {
            this.setData({
              'list.isLoadingMore': false,
            });
          }
        }
      },

      async onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
        const done = event?.detail?.done;
        const { list } = this.data;

        if (list.isLoading || list.isLoadingMore || list.isRefreshing) {
          done?.();
          return;
        }

        const currentToken = ++requestToken;

        try {
          this.setData({
            'list.isRefreshing': true,
            'list.errorMessage': '',
          });

          const result = await fetchPage('refresh');

          if (currentToken !== requestToken) {
            return;
          }

          this.setData({
            'list.data': result.data,
            'list.total': result.total,
            'list.finished': result.finished,
          });

          return result;
        } catch (error) {
          if (currentToken === requestToken) {
            this.setData({
              'list.errorMessage': getErrorMessage(error),
            });
          }

          throw error;
        } finally {
          if (currentToken === requestToken) {
            this.setData({
              'list.isRefreshing': false,
            });
          }

          done?.();
        }
      },

      replaceListData(data: R[], options?: Partial<Omit<TransformedListData<R>, 'data'>>) {
        this.setData({
          'list.data': data,
          ...(options?.finished !== undefined ? { 'list.finished': options.finished } : {}),
          ...(options?.total !== undefined ? { 'list.total': options.total } : {}),
          'list.initialized': true,
        });
      },

      appendListData(data: R[], options?: Partial<Omit<TransformedListData<R>, 'data'>>) {
        this.setData({
          'list.data': [...this.data.list.data, ...data],
          ...(options?.finished !== undefined ? { 'list.finished': options.finished } : {}),
          ...(options?.total !== undefined ? { 'list.total': options.total } : {}),
          'list.initialized': true,
        });
      },

      updateOne(update: { id: string | number; change: Partial<R> }) {
        const { id, change } = update;
        const dataToUpdate: Record<string, R> = {};

        this.data.list.data.forEach((item, index) => {
          if (selectId(item) === id) {
            dataToUpdate[`list.data[${index}]`] = { ...item, ...change };
          }
        });

        if (Object.keys(dataToUpdate).length === 0) {
          return;
        }

        this.setData(dataToUpdate);
      },

      updateMany(updates: Array<{ id: string | number; change: Partial<R> }>) {
        const updateMap = new Map(updates.map((item) => [item.id, item.change]));
        const dataToUpdate: Record<string, R> = {};

        this.data.list.data.forEach((item, index) => {
          const id = selectId(item);
          const change = updateMap.get(id);

          if (change) {
            dataToUpdate[`list.data[${index}]`] = { ...item, ...change };
          }
        });

        if (Object.keys(dataToUpdate).length === 0) {
          return;
        }

        this.setData(dataToUpdate);
      },

      removeOne(id: string | number) {
        const nextData = this.data.list.data.filter((item) => selectId(item) !== id);

        this.setData({
          'list.data': nextData,
          'list.total': Math.max(this.data.list.total - 1, nextData.length),
          'list.finished': this.data.list.finished || nextData.length === 0,
        });
      },
    },
  });
}
