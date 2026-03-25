import {
  fetchManagementFeeDisclosureTree,
  formatManagementFeeDateTime,
  ManagementFeeDisclosureBuildingItem,
  ManagementFeeDisclosureHouseItem,
  ManagementFeeDisclosurePeriodItem,
} from '../../../services/management-fee';

const ALL_FILTER = 'ALL';
const DETAIL_PAGE = '/pages/disclosure/payment/detail/index';

type RateTone = 'high' | 'medium' | 'low';

interface FilterOption {
  label: string;
  value: string;
}

interface PickerOption {
  label: string;
  value: string;
}

interface PeriodCardView {
  periodKey: string;
  periodMonth: string | null;
  rangeText: string;
  updatedAtText: string;
  receivableAmount: number;
  paidAmount: number;
  unpaidHouseholds: number;
  paymentRate: number;
  receivableText: string;
  paidText: string;
  paymentRateText: string;
  unpaidHouseholdsText: string;
  statusTone: RateTone;
  statusLabel: string;
}

interface SummaryView {
  periodCountText: string;
  receivableText: string;
  paidText: string;
  paymentRateText: string;
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`;
}

function formatRate(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
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

function getRateLabel(rate: number) {
  if (rate > 80) {
    return '缴费率高';
  }

  if (rate >= 30) {
    return '缴费推进中';
  }

  return '缴费率低';
}

function summarizeHouses(houses: ManagementFeeDisclosureHouseItem[]) {
  return houses.reduce(
    (result, item) => {
      result.houseCount += 1;
      result.receivableAmount += item.receivableAmount;
      result.paidAmount += item.paidAmount;

      if (item.paymentStatus === 'PAID') {
        result.paidHouseholds += 1;
      }

      return result;
    },
    {
      houseCount: 0,
      receivableAmount: 0,
      paidAmount: 0,
      paidHouseholds: 0,
    },
  );
}

function buildPeriodOptions(periods: ManagementFeeDisclosurePeriodItem[]): FilterOption[] {
  return [
    { label: '全部账期', value: ALL_FILTER },
    ...periods.map((item) => ({
      label: item.rangeLabel,
      value: item.periodKey,
    })),
  ];
}

function buildBuildingOptions(periods: ManagementFeeDisclosurePeriodItem[], selectedPeriodKey: string): FilterOption[] {
  const scopedPeriods =
    selectedPeriodKey === ALL_FILTER ? periods : periods.filter((item) => item.periodKey === selectedPeriodKey);
  const options = Array.from(
    new Map(
      scopedPeriods
        .flatMap((item) => item.buildings)
        .map((item) => [item.buildingId, { label: item.buildingName, value: item.buildingId }]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  return [{ label: '全部楼栋', value: ALL_FILTER }, ...options];
}

function filterBuildings(buildings: ManagementFeeDisclosureBuildingItem[], selectedBuildingId: string) {
  return buildings.filter((item) => selectedBuildingId === ALL_FILTER || item.buildingId === selectedBuildingId);
}

function mapPeriodCard(
  period: ManagementFeeDisclosurePeriodItem,
  buildings: ManagementFeeDisclosureBuildingItem[],
  updatedAtText: string,
): PeriodCardView {
  const summary = buildings.reduce(
    (result, building) => {
      const buildingSummary = summarizeHouses(building.houses);
      result.houseCount += buildingSummary.houseCount;
      result.receivableAmount += buildingSummary.receivableAmount;
      result.paidAmount += buildingSummary.paidAmount;
      result.paidHouseholds += buildingSummary.paidHouseholds;
      return result;
    },
    {
      houseCount: 0,
      receivableAmount: 0,
      paidAmount: 0,
      paidHouseholds: 0,
    },
  );

  const paymentRate = summary.receivableAmount > 0 ? (summary.paidAmount / summary.receivableAmount) * 100 : 0;
  const unpaidHouseholds = Math.max(summary.houseCount - summary.paidHouseholds, 0);

  return {
    periodKey: period.periodKey,
    periodMonth: period.periodMonth,
    rangeText: period.rangeLabel,
    updatedAtText,
    receivableAmount: Number(summary.receivableAmount.toFixed(2)),
    paidAmount: Number(summary.paidAmount.toFixed(2)),
    unpaidHouseholds,
    paymentRate: Number(paymentRate.toFixed(2)),
    receivableText: formatCurrency(summary.receivableAmount),
    paidText: formatCurrency(summary.paidAmount),
    paymentRateText: formatRate(paymentRate),
    unpaidHouseholdsText: `未缴 ${unpaidHouseholds} 户`,
    statusTone: getRateTone(paymentRate),
    statusLabel: getRateLabel(paymentRate),
  };
}

function buildPeriodCards(
  periods: ManagementFeeDisclosurePeriodItem[],
  selectedPeriodKey: string,
  selectedBuildingId: string,
  updatedAtText: string,
) {
  return periods
    .slice()
    .sort((a, b) => b.periodKey.localeCompare(a.periodKey))
    .filter((item) => selectedPeriodKey === ALL_FILTER || item.periodKey === selectedPeriodKey)
    .map((period) => {
      const buildings = filterBuildings(period.buildings, selectedBuildingId);

      if (!buildings.length) {
        return null;
      }

      return mapPeriodCard(period, buildings, updatedAtText);
    })
    .filter((item): item is PeriodCardView => !!item);
}

function buildSummary(cards: PeriodCardView[]): SummaryView {
  const aggregated = cards.reduce(
    (result, item) => {
      result.periodCount += 1;
      result.receivableAmount += item.receivableAmount;
      result.paidAmount += item.paidAmount;
      return result;
    },
    {
      periodCount: 0,
      receivableAmount: 0,
      paidAmount: 0,
    },
  );
  const paymentRate =
    aggregated.receivableAmount > 0 ? (aggregated.paidAmount / aggregated.receivableAmount) * 100 : 0;

  return {
    periodCountText: `${aggregated.periodCount} 个账期`,
    receivableText: formatCurrency(aggregated.receivableAmount),
    paidText: formatCurrency(aggregated.paidAmount),
    paymentRateText: formatRate(paymentRate),
  };
}

function findOptionIndex(options: FilterOption[], value: string) {
  const index = options.findIndex((item) => item.value === value);
  return index >= 0 ? index : 0;
}

function getPickerResult(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
  const values = Array.isArray(event.detail.value) ? event.detail.value : [];
  const labels = Array.isArray(event.detail.label) ? event.detail.label : [];

  return {
    value: values[0] || '',
    label: labels[0] || '',
  };
}

Page({
  data: {
    disclosureTitle: '收费公示',
    disclosureNote: '',
    publisherText: '',
    updatedAtText: '',
    allPeriods: [] as ManagementFeeDisclosurePeriodItem[],
    periodCards: [] as PeriodCardView[],
    summary: {
      periodCountText: '0 个账期',
      receivableText: '¥0.00',
      paidText: '¥0.00',
      paymentRateText: '0%',
    } as SummaryView,
    loading: false,
    isLoadMore: false,
    finished: false,
    errorMessage: '',
    emptyDescription: '暂无收费公示数据',
    periodOptions: [{ label: '全部账期', value: ALL_FILTER }] as FilterOption[],
    buildingOptions: [{ label: '全部楼栋', value: ALL_FILTER }] as FilterOption[],
    periodPickerOptions: [{ label: '全部账期', value: ALL_FILTER }] as PickerOption[],
    buildingPickerOptions: [{ label: '全部楼栋', value: ALL_FILTER }] as PickerOption[],
    periodPickerVisible: false,
    buildingPickerVisible: false,
    periodPickerValue: [ALL_FILTER] as string[],
    buildingPickerValue: [ALL_FILTER] as string[],
    periodIndex: 0,
    buildingIndex: 0,
    currentPeriodLabel: '全部账期',
    currentBuildingLabel: '全部楼栋',
    selectedPeriodKey: ALL_FILTER,
    selectedBuildingId: ALL_FILTER,
  },

  onLoad() {
    void this.loadDisclosure();
  },

  async loadDisclosure() {
    this.setData({
      loading: true,
      errorMessage: '',
    });

    try {
      const result = await fetchManagementFeeDisclosureTree();
      const updatedAtText = formatManagementFeeDateTime(result.updatedAt);
      const periodOptions = buildPeriodOptions(result.periods);
      const buildingOptions = buildBuildingOptions(result.periods, ALL_FILTER);
      const periodCards = buildPeriodCards(result.periods, ALL_FILTER, ALL_FILTER, updatedAtText);

      this.setData({
        disclosureTitle: result.title || '收费公示',
        disclosureNote: result.note || '',
        publisherText: result.publisher || '',
        updatedAtText,
        allPeriods: result.periods,
        periodCards,
        summary: buildSummary(periodCards),
        periodOptions,
        buildingOptions,
        periodPickerOptions: periodOptions,
        buildingPickerOptions: buildingOptions,
        periodPickerValue: [ALL_FILTER],
        buildingPickerValue: [ALL_FILTER],
        periodIndex: 0,
        buildingIndex: 0,
        currentPeriodLabel: periodOptions[0]?.label || '全部账期',
        currentBuildingLabel: buildingOptions[0]?.label || '全部楼栋',
        selectedPeriodKey: ALL_FILTER,
        selectedBuildingId: ALL_FILTER,
        emptyDescription: '暂无收费公示数据',
      });
    } catch (error) {
      console.error('load management fee disclosure tree failed', error);
      const message = error instanceof Error ? error.message : '收费公示加载失败';

      this.setData({
        allPeriods: [],
        periodCards: [],
        summary: buildSummary([]),
        errorMessage: message,
        emptyDescription: message,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    void this.loadDisclosure().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onListRefresh(event?: WechatMiniprogram.CustomEvent<{ done?: () => void }>) {
    void this.loadDisclosure().finally(() => {
      event?.detail?.done?.();
    });
  },

  openPeriodPicker() {
    if (!this.data.periodPickerOptions.length) {
      return;
    }

    this.setData({
      periodPickerVisible: true,
      periodPickerValue: [this.data.selectedPeriodKey || this.data.periodPickerOptions[0].value],
    });
  },

  handlePeriodPickerVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ periodPickerVisible: !!event.detail.visible });
  },

  closePeriodPicker() {
    this.setData({ periodPickerVisible: false });
  },

  handlePeriodConfirm(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
    const selected = getPickerResult(event);

    this.applyFilters({
      selectedPeriodKey: selected.value || ALL_FILTER,
      selectedBuildingId: ALL_FILTER,
    });

    this.setData({
      periodPickerVisible: false,
      periodPickerValue: [selected.value || ALL_FILTER],
    });
  },

  openBuildingPicker() {
    if (!this.data.buildingPickerOptions.length) {
      return;
    }

    this.setData({
      buildingPickerVisible: true,
      buildingPickerValue: [this.data.selectedBuildingId || this.data.buildingPickerOptions[0].value],
    });
  },

  handleBuildingPickerVisibleChange(event: WechatMiniprogram.CustomEvent<{ visible?: boolean }>) {
    this.setData({ buildingPickerVisible: !!event.detail.visible });
  },

  closeBuildingPicker() {
    this.setData({ buildingPickerVisible: false });
  },

  handleBuildingConfirm(event: WechatMiniprogram.CustomEvent<{ value?: string[]; label?: string[] }>) {
    const selected = getPickerResult(event);

    this.applyFilters({
      selectedBuildingId: selected.value || ALL_FILTER,
    });

    this.setData({
      buildingPickerVisible: false,
      buildingPickerValue: [selected.value || ALL_FILTER],
    });
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: string };

    if (!key) {
      return;
    }

    wx.navigateTo({
      url: `${DETAIL_PAGE}?periodKey=${encodeURIComponent(key)}`,
    });
  },

  applyFilters(next: Partial<{ selectedPeriodKey: string; selectedBuildingId: string }>) {
    const selectedPeriodKey = next.selectedPeriodKey ?? this.data.selectedPeriodKey;
    const periodOptions = this.data.periodOptions;
    const buildingOptions = buildBuildingOptions(this.data.allPeriods, selectedPeriodKey);
    const preferredBuildingId = next.selectedBuildingId ?? this.data.selectedBuildingId;
    const selectedBuildingId = buildingOptions.some((item) => item.value === preferredBuildingId)
      ? preferredBuildingId
      : ALL_FILTER;
    const periodCards = buildPeriodCards(
      this.data.allPeriods,
      selectedPeriodKey,
      selectedBuildingId,
      this.data.updatedAtText,
    );
    const periodIndex = findOptionIndex(periodOptions, selectedPeriodKey);
    const buildingIndex = findOptionIndex(buildingOptions, selectedBuildingId);
    const hasFilters = selectedPeriodKey !== ALL_FILTER || selectedBuildingId !== ALL_FILTER;

    this.setData({
      selectedPeriodKey,
      selectedBuildingId,
      periodCards,
      summary: buildSummary(periodCards),
      buildingOptions,
      buildingPickerOptions: buildingOptions,
      periodIndex,
      buildingIndex,
      periodPickerValue: [selectedPeriodKey],
      buildingPickerValue: [selectedBuildingId],
      currentPeriodLabel: periodOptions[periodIndex]?.label || '全部账期',
      currentBuildingLabel: buildingOptions[buildingIndex]?.label || '全部楼栋',
      emptyDescription: hasFilters ? '当前筛选条件下暂无收费公示数据' : '暂无收费公示数据',
    });
  },
});
