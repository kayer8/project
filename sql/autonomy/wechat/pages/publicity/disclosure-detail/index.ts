import { getDisclosureDetail } from '../../../services/mock';

Page({
  data: {
    record: null as ReturnType<typeof getDisclosureDetail> | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      record: getDisclosureDetail(query.id || ''),
    });
  },
});
