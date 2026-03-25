import {
  fetchManagementFeeDisclosureTree,
  formatManagementFeeDate,
  formatManagementFeeDateTime,
  ManagementFeeDisclosureBuildingItem,
  ManagementFeeDisclosureHouseItem,
  ManagementFeePaymentStatus,
} from '../../../../services/management-fee';

type StatusTone = 'paid' | 'partial' | 'unpaid';
type RateTone = 'high' | 'medium' | 'low';

interface HouseView extends ManagementFeeDisclosureHouseItem {
  houseLabel: string;
  areaText: string;
  receivableText: string;
  paidText: string;
  paidAtText: string;
  paymentStatusText: string;
  statusTone: StatusTone;
}

interface BuildingView {
  buildingId: string;
  buildingName: string;
  houseCount: number;
  unpaidHouseholds: number;
  receivableAmount: number;
  paidAmount: number;
  paymentRate: number;
  receivableText: string;
  paidText: string;
  paymentRateText: string;
  houses: HouseView[];
}

interface BuildingTab {
  label: string;
  value: string;
  badge?: string;
}

interface SummaryView {
  receivableText: string;
  paidText: string;
  paymentRateText: string;
  unpaidText: string;
  buildingCountText: string;
  rateTone: RateTone;
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

function formatRate(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
}

function getStatusTone(status: ManagementFeePaymentStatus): StatusTone {
  if (status === 'PAID') {
    return 'paid';
  }

  if (status === 'PARTIAL') {
    return 'partial';
  }

  return 'unpaid';
}

function getStatusText(status: ManagementFeePaymentStatus) {
  if (status === 'PAID') {
    return '已缴清';
  }

  if (status === 'PARTIAL') {
    return '部分缴纳';
  }

  if (status === 'OVERDUE') {
    return '逾期未缴';
  }

  return '待缴纳';
}

function getRateTone(rate: number): RateTone {
  if (rate > 80) {
    return 'high';
  }

  if (rate >= 30) {
    return 'medium';
  }

  return 'low';
}

function mapHouseView(item: ManagementFeeDisclosureHouseItem): HouseView {
  const houseLabel = item.displayName || [item.unitNo, item.roomNo].filter(Boolean).join('-') || item.houseId;

  return {
    ...item,
    houseLabel,
    areaText: `${item.grossArea.toFixed(2)}㎡`,
    receivableText: formatCurrency(item.receivableAmount),
    paidText: formatCurrency(item.paidAmount),
    paidAtText: formatManagementFeeDateTime(item.lastPaidAt) || '暂无记录',
    paymentStatusText: item.paymentStatusLabel || getStatusText(item.paymentStatus),
    statusTone: getStatusTone(item.paymentStatus),
  };
}

function mapBuildingView(building: ManagementFeeDisclosureBuildingItem): BuildingView {
  const houseCount = building.houses.length;
  const paidHouseholds = building.houses.filter((item) => item.paymentStatus === 'PAID').length;
  const unpaidHouseholds = Math.max(houseCount - paidHouseholds, 0);
  const receivableAmount = building.houses.reduce((sum, item) => sum + item.receivableAmount, 0);
  const paidAmount = building.houses.reduce((sum, item) => sum + item.paidAmount, 0);
  const paymentRate = receivableAmount > 0 ? (paidAmount / receivableAmount) * 100 : 0;

  return {
    buildingId: building.buildingId,
    buildingName: building.buildingName,
    houseCount,
    unpaidHouseholds,
    receivableAmount: Number(receivableAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    paymentRate: Number(paymentRate.toFixed(2)),
    receivableText: formatCurrency(receivableAmount),
    paidText: formatCurrency(paidAmount),
    paymentRateText: formatRate(paymentRate),
    houses: building.houses.map(mapHouseView),
  };
}

function buildSummary(buildings: ManagementFeeDisclosureBuildingItem[]): SummaryView {
  const summary = buildings.reduce(
    (result, building) => {
      const houseCount = building.houses.length;
      const paidHouseholds = building.houses.filter((item) => item.paymentStatus === 'PAID').length;
      const receivableAmount = building.houses.reduce((sum, item) => sum + item.receivableAmount, 0);
      const paidAmount = building.houses.reduce((sum, item) => sum + item.paidAmount, 0);

      result.buildingCount += 1;
      result.houseCount += houseCount;
      result.paidHouseholds += paidHouseholds;
      result.receivableAmount += receivableAmount;
      result.paidAmount += paidAmount;
      return result;
    },
    {
      buildingCount: 0,
      houseCount: 0,
      paidHouseholds: 0,
      receivableAmount: 0,
      paidAmount: 0,
    },
  );

  const unpaidHouseholds = Math.max(summary.houseCount - summary.paidHouseholds, 0);
  const paymentRate = summary.receivableAmount > 0 ? (summary.paidAmount / summary.receivableAmount) * 100 : 0;

  return {
    receivableText: formatCurrency(summary.receivableAmount),
    paidText: formatCurrency(summary.paidAmount),
    paymentRateText: formatRate(paymentRate),
    unpaidText: `未缴 ${unpaidHouseholds} 户`,
    buildingCountText: `${summary.buildingCount} 栋`,
    rateTone: getRateTone(paymentRate),
  };
}

function buildBuildingTabs(buildings: BuildingView[]): BuildingTab[] {
  return buildings.map((item) => ({
    label: item.buildingName,
    value: item.buildingId,
    badge: item.unpaidHouseholds > 0 ? `${item.unpaidHouseholds}` : '',
  }));
}

function sortBuildings(buildings: ManagementFeeDisclosureBuildingItem[]) {
  return [...buildings].sort((a, b) => a.buildingName.localeCompare(b.buildingName, 'zh-CN', { numeric: true }));
}

function filterBuildingHouses(building: BuildingView | null, keyword: string) {
  if (!building) {
    return null;
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return building;
  }

  const houses = building.houses.filter((house) =>
    [house.houseLabel, house.displayName, house.roomNo, house.unitNo]
      .filter(Boolean)
      .some((text) => text.toLowerCase().includes(normalizedKeyword)),
  );

  return {
    ...building,
    houses,
  };
}

function getSidebarResult(event: WechatMiniprogram.CustomEvent<{ value?: string; label?: string }>) {
  return {
    value: event.detail.value || '',
    label: event.detail.label || '',
  };
}

Page({
  data: {
    navbarTitle: '收费详情',
    periodTitle: '',
    periodMeta: '',
    publisherText: '',
    updatedAtText: '',
    periodKey: '',
    rawBuildings: [] as BuildingView[],
    buildingTabs: [] as BuildingTab[],
    activeBuildingId: '',
    activeBuildingName: '',
    activeBuilding: null as BuildingView | null,
    summary: {
      receivableText: '¥0.00',
      paidText: '¥0.00',
      paymentRateText: '0%',
      unpaidText: '未缴 0 户',
      buildingCountText: '0 栋',
      rateTone: 'low',
    } as SummaryView,
    keyword: '',
    loading: false,
    errorMessage: '',
    emptyDescription: '暂无账期明细数据',
  },

  onLoad(query: Record<string, string | undefined>) {
    const periodKey = query.periodKey?.trim();

    if (!periodKey) {
      this.setData({
        errorMessage: '缺少账期参数',
        emptyDescription: '缺少账期参数',
      });
      return;
    }

    this.setData({ periodKey });
    void this.loadDetail(periodKey);
  },

  onPullDownRefresh() {
    if (!this.data.periodKey) {
      wx.stopPullDownRefresh();
      return;
    }

    void this.loadDetail(this.data.periodKey).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadDetail(periodKey: string) {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const result = await fetchManagementFeeDisclosureTree({ periodKey });
      const period = result.periods[0];

      if (!period) {
        throw new Error('未找到该账期的收费明细');
      }

      const rawBuildings = sortBuildings(period.buildings).map(mapBuildingView);
      const buildingTabs = buildBuildingTabs(rawBuildings);
      const activeBuilding = rawBuildings[0] || null;

      this.setData({
        navbarTitle: '收费详情',
        periodTitle: period.rangeLabel,
        periodMeta: period.dueDate ? `截止日期 ${formatManagementFeeDate(period.dueDate)}` : '未设置截止日期',
        publisherText: result.publisher || '',
        updatedAtText: formatManagementFeeDateTime(result.updatedAt),
        rawBuildings,
        buildingTabs,
        activeBuildingId: activeBuilding?.buildingId || '',
        activeBuildingName: activeBuilding?.buildingName || '',
        activeBuilding,
        summary: buildSummary(period.buildings),
        keyword: '',
        emptyDescription: '暂无账期明细数据',
      });
    } catch (error) {
      console.error('load management fee detail failed', error);
      const message = error instanceof Error ? error.message : '收费详情加载失败';

      this.setData({
        rawBuildings: [],
        buildingTabs: [],
        activeBuildingId: '',
        activeBuildingName: '',
        activeBuilding: null,
        summary: buildSummary([]),
        errorMessage: message,
        emptyDescription: message,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleKeywordInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const keyword = event.detail.value || '';
    const activeBuilding =
      this.data.rawBuildings.find((item) => item.buildingId === this.data.activeBuildingId) || null;

    this.setData({
      keyword,
      activeBuilding: filterBuildingHouses(activeBuilding, keyword),
      emptyDescription: keyword.trim() ? '当前搜索条件下暂无房屋明细' : '暂无账期明细数据',
    });
  },

  handleSideBarChange(event: WechatMiniprogram.CustomEvent<{ value?: string; label?: string }>) {
    const selected = getSidebarResult(event);
    const activeBuilding =
      this.data.rawBuildings.find((item) => item.buildingId === selected.value) || this.data.rawBuildings[0] || null;

    this.setData({
      activeBuildingId: activeBuilding?.buildingId || '',
      activeBuildingName: activeBuilding?.buildingName || selected.label || '',
      activeBuilding: filterBuildingHouses(activeBuilding, this.data.keyword),
    });
  },
});
