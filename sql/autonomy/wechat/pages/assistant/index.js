"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../mock/community");
const list_1 = require("../../utils/list");
Page({
    data: {
        allSuggestions: community_1.aiSuggestions,
        suggestions: [],
        loading: false,
        isLoadMore: false,
        finished: false,
        pageSize: 6,
    },
    onLoad() {
        this.applySuggestions(true);
    },
    onListRefresh(event) {
        this.applySuggestions(true);
        event.detail?.done?.();
    },
    onListLoadMore() {
        if (this.data.finished || this.data.isLoadMore) {
            return;
        }
        this.setData({ isLoadMore: true });
        this.applySuggestions(false);
        this.setData({ isLoadMore: false });
    },
    applySuggestions(reset = true, source) {
        const listSource = source ?? this.data.allSuggestions;
        const result = reset
            ? (0, list_1.getLocalListFirstPage)(listSource, this.data.pageSize)
            : (0, list_1.getLocalListPage)(listSource, this.data.suggestions.length, this.data.pageSize);
        this.setData({
            suggestions: reset ? result.items : [...this.data.suggestions, ...result.items],
            finished: result.finished,
        });
    },
});
