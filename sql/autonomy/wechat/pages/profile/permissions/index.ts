import { permissionItems } from '../../../mock/community';

Page({
  data: {
    items: permissionItems.map((item) => ({ ...item })),
  },

  handleSwitchChange(event: WechatMiniprogram.CustomEvent<{ value?: boolean }>) {
    const { key } = event.currentTarget.dataset as { key?: string };

    if (!key) {
      return;
    }

    this.setData({
      items: this.data.items.map((item) =>
        item.key === key
          ? {
              ...item,
              value: !!event.detail?.value,
            }
          : item,
      ),
    });
  },
});
