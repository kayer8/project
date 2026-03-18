import { ROUTES } from '../../../constants/routes';
import { getBuildingPayments } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

Page({
  data: {
    records: getBuildingPayments(),
    averageRate: '',
  },

  onShow() {
    const records = getBuildingPayments();
    const averageRate =
      records.length > 0
        ? `${(
            records.reduce((sum, item) => sum + Number(item.paidRate.replace('%', '')), 0) / records.length
          ).toFixed(1)}%`
        : '0%';

    this.setData({
      records,
      averageRate,
    });
  },

  handleOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.finance.buildingDetail, { id });
  },
});
