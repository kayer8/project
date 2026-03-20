import { ROUTES } from '../../../constants/routes';
import { votes } from '../../../mock/community';
import { navigateTo } from '../../../utils/nav';

Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    votes,
  },

  methods: {
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
  },
});
