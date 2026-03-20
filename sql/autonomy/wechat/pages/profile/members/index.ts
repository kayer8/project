import { ROUTES } from '../../../constants/routes';
import { members } from '../../../mock/community';
import { navigateTo } from '../../../utils/nav';

Page({
  data: {
    members: [...members],
  },

  openInvite() {
    navigateTo(ROUTES.profile.invite);
  },

  openPermissions() {
    navigateTo(ROUTES.profile.permissions);
  },

  handleRemove(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    this.setData({
      members: this.data.members.filter((item) => item.id !== id),
    });
  },
});
