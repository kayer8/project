"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const tabs = [
    { value: 'disclosure', label: '首页', url: routes_1.ROUTES.disclosure.index, icon: 'view-list' },
    { value: 'voting', label: '投票', url: routes_1.ROUTES.voting.index, icon: 'check-circle' },
    { value: 'profile', label: '我的', url: routes_1.ROUTES.profile.index, icon: 'user' },
];
Component({
    properties: {
        value: {
            type: String,
            value: 'disclosure',
        },
        mode: {
            type: String,
            value: 'page',
        },
    },
    data: {
        tabs,
    },
    methods: {
        handleChange(event) {
            const nextValue = String(event.detail?.value || '');
            if (!nextValue || nextValue === this.data.value) {
                return;
            }
            const nextTab = tabs.find((item) => item.value === nextValue);
            if (!nextTab) {
                return;
            }
            if (this.data.mode === 'switch') {
                this.triggerEvent('tabchange', {
                    value: nextValue,
                    url: nextTab.url,
                });
                return;
            }
            wx.reLaunch({ url: nextTab.url });
        },
    },
});
