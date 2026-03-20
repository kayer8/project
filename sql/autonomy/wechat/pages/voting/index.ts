import { ROUTES } from '../../constants/routes';
import { votes } from '../../mock/community';
import { navigateTo } from '../../utils/nav';

Page({
  data: {
    votes,
  },

  openVoteDetail(event: WechatMiniprogram.BaseEvent) {
    const { id } = event.currentTarget.dataset as { id?: string };

    if (!id) {
      return;
    }

    navigateTo(ROUTES.voting.detail, { id });
  },

  openCreateVote() {
    navigateTo(ROUTES.voting.create);
  },
});
