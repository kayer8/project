"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const disclosure_1 = require("../../../services/disclosure");
function splitDisclosureParagraphs(content) {
    return content
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}
Page({
    data: {
        loading: false,
        errorMessage: '',
        item: null,
    },
    onLoad(query) {
        if (!query.id) {
            this.setData({
                errorMessage: '缺少公开内容标识',
            });
            return;
        }
        void this.loadDetail(query.id);
    },
    async loadDetail(id) {
        this.setData({
            loading: true,
            errorMessage: '',
        });
        try {
            const item = await (0, disclosure_1.fetchDisclosureContentDetail)(id);
            this.setData({
                item: {
                    ...item,
                    displayDate: (0, disclosure_1.formatDisclosureDate)((0, disclosure_1.getDisclosureDisplayDate)(item)),
                    summaryText: item.summary || '',
                    contentText: item.content || '',
                    summaryParagraphs: splitDisclosureParagraphs(item.summary || ''),
                    contentParagraphs: splitDisclosureParagraphs(item.content || ''),
                },
            });
        }
        catch (error) {
            console.error('load disclosure detail failed', error);
            this.setData({
                item: null,
                errorMessage: error instanceof Error ? error.message : '公开详情加载失败',
            });
        }
        finally {
            this.setData({ loading: false });
        }
    },
});
