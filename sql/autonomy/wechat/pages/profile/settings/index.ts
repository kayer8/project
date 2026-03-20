Page({
  data: {
    notifyBill: true,
    notifyAnnouncement: true,
    notifyVote: false,
  },

  handleSwitchChange(event: WechatMiniprogram.CustomEvent<{ value?: boolean }>) {
    const { field } = event.currentTarget.dataset as { field?: 'notifyBill' | 'notifyAnnouncement' | 'notifyVote' };

    if (!field) {
      return;
    }

    this.setData({ [field]: !!event.detail?.value } as WechatMiniprogram.IAnyObject);
  },
});
