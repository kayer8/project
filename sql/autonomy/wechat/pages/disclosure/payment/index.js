"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const management_fee_1 = require("../../../services/management-fee");
const ALL_FILTER = 'ALL';
function formatCurrency(value) {
    return `¥${value.toFixed(2)}`;
}
function formatRate(value) {
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
}
function getStatusTone(status) {
    if (status === 'PAID') {
        return 'paid';
    }
    if (status === 'PARTIAL') {
        return 'partial';
    }
    return 'unpaid';
}
function getStatusText(status) {
    if (status === 'PAID') {
        return '已缴';
    }
    if (status === 'PARTIAL') {
        return '部分缴纳';
    }
    return '未缴';
}
function summarizeHouses(houses) {
    return houses.reduce((result, item) => {
        result.houseCount += 1;
        result.receivableAmount += item.receivableAmount;
        result.paidAmount += item.paidAmount;
        result.outstandingAmount += item.outstandingAmount;
        if (item.paymentStatus === 'PAID') {
            result.paidHouseholds += 1;
        }
        else if (item.paymentStatus === 'PARTIAL') {
            result.partialHouseholds += 1;
        }
        else if (item.paymentStatus === 'OVERDUE') {
            result.overdueHouseholds += 1;
        }
        return result;
    }, {
        houseCount: 0,
        receivableAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        paidHouseholds: 0,
        partialHouseholds: 0,
        overdueHouseholds: 0,
    });
}
function mapHouseView(item) {
    const houseLabel = item.displayName || [item.unitNo, item.roomNo].filter(Boolean).join('-') || item.houseId;
    const houseCode = item.displayName || item.roomNo || item.houseId;
    return {
        ...item,
        houseLabel,
        secondaryText: `房屋编号 ${houseCode} · 建筑面积 ${item.grossArea.toFixed(2)}㎡`,
        receivableText: formatCurrency(item.receivableAmount),
        paidText: formatCurrency(item.paidAmount),
        paidAtText: (0, management_fee_1.formatManagementFeeDateTime)(item.lastPaidAt) || '暂无记录',
        paymentStatusText: getStatusText(item.paymentStatus),
        statusTone: getStatusTone(item.paymentStatus),
    };
}
function mapBuildingView(building, houses) {
    const summary = summarizeHouses(houses);
    const paymentRate = summary.receivableAmount > 0 ? (summary.paidAmount / summary.receivableAmount) * 100 : 0;
    const unpaidHouseholds = Math.max(summary.houseCount - summary.paidHouseholds, 0);
    return {
        buildingId: building.buildingId,
        buildingName: building.buildingName,
        houseCount: summary.houseCount,
        receivableAmount: Number(summary.receivableAmount.toFixed(2)),
        paidAmount: Number(summary.paidAmount.toFixed(2)),
        outstandingAmount: Number(summary.outstandingAmount.toFixed(2)),
        paidHouseholds: summary.paidHouseholds,
        partialHouseholds: summary.partialHouseholds,
        overdueHouseholds: summary.overdueHouseholds,
        unpaidHouseholds,
        paymentRate: Number(paymentRate.toFixed(2)),
        receivableText: formatCurrency(summary.receivableAmount),
        paidText: formatCurrency(summary.paidAmount),
        paymentRateText: formatRate(paymentRate),
        paidHouseholdsText: `${summary.paidHouseholds} 户已缴`,
        unpaidHouseholdsText: `${unpaidHouseholds} 户未结清`,
        houses: houses.map(mapHouseView),
    };
}
function mapPeriodView(period, buildings) {
    const summary = buildings.reduce((result, item) => {
        result.houseCount += item.houseCount;
        result.receivableAmount += item.receivableAmount;
        result.paidAmount += item.paidAmount;
        result.outstandingAmount += item.outstandingAmount;
        result.paidHouseholds += item.paidHouseholds;
        result.partialHouseholds += item.partialHouseholds;
        result.overdueHouseholds += item.overdueHouseholds;
        return result;
    }, {
        houseCount: 0,
        receivableAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        paidHouseholds: 0,
        partialHouseholds: 0,
        overdueHouseholds: 0,
    });
    const paymentRate = summary.receivableAmount > 0 ? (summary.paidAmount / summary.receivableAmount) * 100 : 0;
    const unpaidHouseholds = Math.max(summary.houseCount - summary.paidHouseholds, 0);
    return {
        periodKey: period.periodKey,
        periodMonth: period.periodMonth,
        rangeText: period.rangeLabel,
        dueDateText: period.dueDate ? `截止 ${(0, management_fee_1.formatManagementFeeDate)(period.dueDate)}` : '未设置截止时间',
        buildingCountText: `${buildings.length} 栋`,
        houseCount: summary.houseCount,
        receivableAmount: Number(summary.receivableAmount.toFixed(2)),
        paidAmount: Number(summary.paidAmount.toFixed(2)),
        outstandingAmount: Number(summary.outstandingAmount.toFixed(2)),
        paidHouseholds: summary.paidHouseholds,
        partialHouseholds: summary.partialHouseholds,
        overdueHouseholds: summary.overdueHouseholds,
        unpaidHouseholds,
        paymentRate: Number(paymentRate.toFixed(2)),
        receivableText: formatCurrency(summary.receivableAmount),
        paidText: formatCurrency(summary.paidAmount),
        paymentRateText: formatRate(paymentRate),
        unpaidHouseholdsText: `${unpaidHouseholds} 户未结清`,
        buildings,
    };
}
function buildPeriodOptions(periods) {
    return [
        { label: '全部账期', value: ALL_FILTER },
        ...periods.map((item) => ({
            label: item.rangeLabel,
            value: item.periodKey,
        })),
    ];
}
function buildBuildingOptions(periods, selectedPeriodKey) {
    const scopedPeriods = selectedPeriodKey === ALL_FILTER ? periods : periods.filter((item) => item.periodKey === selectedPeriodKey);
    const options = Array.from(new Map(scopedPeriods
        .flatMap((item) => item.buildings)
        .map((item) => [item.buildingId, { label: item.buildingName, value: item.buildingId }])).values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
    return [{ label: '全部楼栋', value: ALL_FILTER }, ...options];
}
function buildVisiblePeriods(periods, selectedPeriodKey, selectedBuildingId, keyword) {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const scopedPeriods = selectedPeriodKey === ALL_FILTER ? periods : periods.filter((item) => item.periodKey === selectedPeriodKey);
    return scopedPeriods
        .map((period) => {
        const buildings = period.buildings
            .filter((item) => selectedBuildingId === ALL_FILTER || item.buildingId === selectedBuildingId)
            .map((building) => {
            if (!normalizedKeyword) {
                return mapBuildingView(building, building.houses);
            }
            const buildingMatched = building.buildingName.toLowerCase().includes(normalizedKeyword);
            const houses = buildingMatched
                ? building.houses
                : building.houses.filter((house) => [house.displayName, house.roomNo, house.unitNo, building.buildingName]
                    .filter(Boolean)
                    .some((text) => text.toLowerCase().includes(normalizedKeyword)));
            if (!buildingMatched && !houses.length) {
                return null;
            }
            return mapBuildingView(building, houses);
        })
            .filter((item) => !!item);
        if (!buildings.length) {
            return null;
        }
        return mapPeriodView(period, buildings);
    })
        .filter((item) => !!item);
}
function buildOverview(periods) {
    const summary = periods.reduce((result, item) => {
        result.periodCount += 1;
        result.houseCount += item.houseCount;
        result.receivableAmount += item.receivableAmount;
        result.paidAmount += item.paidAmount;
        result.unpaidHouseholds += item.unpaidHouseholds;
        return result;
    }, {
        periodCount: 0,
        houseCount: 0,
        receivableAmount: 0,
        paidAmount: 0,
        unpaidHouseholds: 0,
    });
    const paymentRate = summary.receivableAmount > 0 ? (summary.paidAmount / summary.receivableAmount) * 100 : 0;
    return {
        receivableText: formatCurrency(summary.receivableAmount),
        paidText: formatCurrency(summary.paidAmount),
        paymentRateText: formatRate(paymentRate),
        houseCountText: `${summary.houseCount} 户`,
        unpaidHouseholdsText: `${summary.unpaidHouseholds} 户`,
        periodCountText: `${summary.periodCount} 个账期`,
    };
}
function findOptionIndex(options, value) {
    const index = options.findIndex((item) => item.value === value);
    return index >= 0 ? index : 0;
}
function resolveExpandedKeys(periods, expandedPeriodKey, expandedBuildingKey) {
    if (!periods.length) {
        return {
            expandedPeriodKey: '',
            expandedBuildingKey: '',
        };
    }
    const currentPeriod = periods.find((item) => item.periodKey === expandedPeriodKey) ?? periods[0];
    const currentBuilding = currentPeriod.buildings.find((item) => item.buildingId === expandedBuildingKey) ?? currentPeriod.buildings[0];
    return {
        expandedPeriodKey: currentPeriod.periodKey,
        expandedBuildingKey: currentBuilding?.buildingId || '',
    };
}
Page({
    data: {
        disclosureTitle: '收费公开',
        disclosureNote: '',
        publisherText: '',
        updatedAtText: '',
        allPeriods: [],
        periods: [],
        overview: {
            receivableText: '¥0.00',
            paidText: '¥0.00',
            paymentRateText: '0%',
            houseCountText: '0 户',
            unpaidHouseholdsText: '0 户',
            periodCountText: '0 个账期',
        },
        loading: false,
        isLoadMore: false,
        finished: false,
        errorMessage: '',
        emptyDescription: '暂无收费公开数据',
        keyword: '',
        periodOptions: [{ label: '全部账期', value: ALL_FILTER }],
        buildingOptions: [{ label: '全部楼栋', value: ALL_FILTER }],
        periodIndex: 0,
        buildingIndex: 0,
        currentPeriodLabel: '全部账期',
        currentBuildingLabel: '全部楼栋',
        selectedPeriodKey: ALL_FILTER,
        selectedBuildingId: ALL_FILTER,
        expandedPeriodKey: '',
        expandedBuildingKey: '',
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
            const result = await (0, management_fee_1.fetchManagementFeeDisclosureTree)();
            const periodOptions = buildPeriodOptions(result.periods);
            const buildingOptions = buildBuildingOptions(result.periods, ALL_FILTER);
            const periods = buildVisiblePeriods(result.periods, ALL_FILTER, ALL_FILTER, '');
            const expanded = resolveExpandedKeys(periods, '', '');
            this.setData({
                disclosureTitle: '收费公开',
                disclosureNote: '按账期、楼栋、房屋三级展示收费数据，便于查看各层级收费汇总与明细情况。',
                publisherText: '物业财务与信息公开组',
                updatedAtText: (0, management_fee_1.formatManagementFeeDateTime)(result.updatedAt),
                allPeriods: result.periods,
                periods,
                overview: buildOverview(periods),
                periodOptions,
                buildingOptions,
                periodIndex: 0,
                buildingIndex: 0,
                currentPeriodLabel: periodOptions[0]?.label || '全部账期',
                currentBuildingLabel: buildingOptions[0]?.label || '全部楼栋',
                selectedPeriodKey: ALL_FILTER,
                selectedBuildingId: ALL_FILTER,
                expandedPeriodKey: expanded.expandedPeriodKey,
                expandedBuildingKey: expanded.expandedBuildingKey,
                emptyDescription: '暂无收费公开数据',
            });
        }
        catch (error) {
            console.error('load management fee disclosure tree failed', error);
            const message = error instanceof Error ? error.message : '收费公开加载失败';
            this.setData({
                allPeriods: [],
                periods: [],
                overview: buildOverview([]),
                errorMessage: message,
                emptyDescription: message,
                expandedPeriodKey: '',
                expandedBuildingKey: '',
            });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    onPullDownRefresh() {
        void this.loadDisclosure().finally(() => {
            wx.stopPullDownRefresh();
        });
    },
    onListRefresh(event) {
        void this.loadDisclosure().finally(() => {
            event?.detail?.done?.();
        });
    },
    handleKeywordInput(event) {
        this.applyFilters({
            keyword: event.detail.value || '',
        });
    },
    handlePeriodChange(event) {
        const index = Number(event.detail.value ?? 0);
        const option = this.data.periodOptions[index] || this.data.periodOptions[0];
        this.applyFilters({
            selectedPeriodKey: option?.value || ALL_FILTER,
            selectedBuildingId: ALL_FILTER,
        });
    },
    handleBuildingChange(event) {
        const index = Number(event.detail.value ?? 0);
        const option = this.data.buildingOptions[index] || this.data.buildingOptions[0];
        this.applyFilters({
            selectedBuildingId: option?.value || ALL_FILTER,
        });
    },
    togglePeriod(event) {
        const { key } = event.currentTarget.dataset;
        if (!key) {
            return;
        }
        if (this.data.expandedPeriodKey === key) {
            this.setData({
                expandedPeriodKey: '',
                expandedBuildingKey: '',
            });
            return;
        }
        const period = this.data.periods.find((item) => item.periodKey === key);
        this.setData({
            expandedPeriodKey: key,
            expandedBuildingKey: period?.buildings[0]?.buildingId || '',
        });
    },
    toggleBuilding(event) {
        const { periodKey, buildingId } = event.currentTarget.dataset;
        if (!periodKey || !buildingId) {
            return;
        }
        this.setData({
            expandedPeriodKey: periodKey,
            expandedBuildingKey: this.data.expandedBuildingKey === buildingId ? '' : buildingId,
        });
    },
    applyFilters(next) {
        const keyword = next.keyword ?? this.data.keyword;
        const selectedPeriodKey = next.selectedPeriodKey ?? this.data.selectedPeriodKey;
        const periodOptions = this.data.periodOptions;
        const buildingOptions = buildBuildingOptions(this.data.allPeriods, selectedPeriodKey);
        const preferredBuildingId = next.selectedBuildingId ?? this.data.selectedBuildingId;
        const selectedBuildingId = buildingOptions.some((item) => item.value === preferredBuildingId)
            ? preferredBuildingId
            : ALL_FILTER;
        const periods = buildVisiblePeriods(this.data.allPeriods, selectedPeriodKey, selectedBuildingId, keyword);
        const expanded = resolveExpandedKeys(periods, this.data.expandedPeriodKey, this.data.expandedBuildingKey);
        const periodIndex = findOptionIndex(periodOptions, selectedPeriodKey);
        const buildingIndex = findOptionIndex(buildingOptions, selectedBuildingId);
        const emptyDescription = this.data.errorMessage ||
            (keyword.trim() || selectedPeriodKey !== ALL_FILTER || selectedBuildingId !== ALL_FILTER
                ? '当前筛选条件下暂无收费数据'
                : '暂无收费公开数据');
        this.setData({
            keyword,
            selectedPeriodKey,
            selectedBuildingId,
            periods,
            overview: buildOverview(periods),
            buildingOptions,
            periodIndex,
            buildingIndex,
            currentPeriodLabel: periodOptions[periodIndex]?.label || '全部账期',
            currentBuildingLabel: buildingOptions[buildingIndex]?.label || '全部楼栋',
            expandedPeriodKey: expanded.expandedPeriodKey,
            expandedBuildingKey: expanded.expandedBuildingKey,
            emptyDescription,
        });
    },
});
