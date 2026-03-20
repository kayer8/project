"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routes_1 = require("../../constants/routes");
const tabs = [
    { value: 'home', label: '工作台', url: routes_1.ROUTES.home },
    { value: 'voting', label: '投票', url: routes_1.ROUTES.voting.index },
    { value: 'assistant', label: 'AI', url: routes_1.ROUTES.assistant },
    { value: 'disclosure', label: '公开', url: routes_1.ROUTES.disclosure.index },
    { value: 'profile', label: '我的', url: routes_1.ROUTES.profile.index },
];
Component({
    properties: {
        value: {
            type: String,
            value: 'home',
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
            wx.reLaunch({ url: nextTab.url });
        },
    },
});
