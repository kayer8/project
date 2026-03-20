import { ROUTES } from '../../constants/routes';

const tabs = [
  { value: 'home', label: '工作台', url: ROUTES.home },
  { value: 'voting', label: '投票', url: ROUTES.voting.index },
  { value: 'assistant', label: 'AI', url: ROUTES.assistant },
  { value: 'disclosure', label: '公开', url: ROUTES.disclosure.index },
  { value: 'profile', label: '我的', url: ROUTES.profile.index },
] as const;

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
    handleChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
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
