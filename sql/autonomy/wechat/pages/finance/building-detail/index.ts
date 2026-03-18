import { getBuildingPaymentDetail } from '../../../services/mock';

Page({
  data: {
    record: null as ReturnType<typeof getBuildingPaymentDetail> | null,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      record: getBuildingPaymentDetail(query.id || ''),
    });
  },
});
