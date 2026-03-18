import { ROUTES } from '../../constants/routes';
import { getAnnouncements, getBuildingPayments, getDisclosures } from '../../services/mock';
import { openRoute } from '../../utils/nav';

Page({
  data: {
    categories: [
      { title: '公告通知', desc: '查看日常通知与会议公告', path: ROUTES.publicity.announcementList },
      { title: '管理公开', desc: '查看整改、月报与治理动态', path: ROUTES.publicity.disclosureList },
      { title: '楼栋缴费', desc: '查看各栋管理费收缴情况', path: ROUTES.finance.buildingList },
    ],
    latestAnnouncements: getAnnouncements().slice(0, 2),
    latestDisclosures: getDisclosures().slice(0, 3),
    latestBuildings: getBuildingPayments().slice(0, 2),
  },

  handleOpenCategory(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    openRoute(path);
  },

  handleOpenAnnouncement(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.announcementDetail, { id });
  },

  handleOpenDisclosure(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.publicity.disclosureDetail, { id });
  },

  handleOpenBuilding(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id: string };
    openRoute(ROUTES.finance.buildingDetail, { id });
  },
});
