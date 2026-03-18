import { ROUTES } from '../../../constants/routes';
import { getAuthResult } from '../../../services/mock';
import type { AuthIdentityType } from '../../../services/mock';
import { openRoute } from '../../../utils/nav';

const titleMap: Record<AuthIdentityType, string> = {
  OWNER: '业主认证',
  TENANT: '租户认证',
  COMMITTEE: '委员会认证',
};

const actionMap: Record<AuthIdentityType, string> = {
  OWNER: ROUTES.auth.ownerSubmit,
  TENANT: ROUTES.auth.tenantSubmit,
  COMMITTEE: ROUTES.auth.committeeSubmit,
};

Page({
  data: {
    type: 'OWNER' as AuthIdentityType,
    typeLabel: titleMap.OWNER,
    result: getAuthResult('OWNER'),
  },

  onLoad(query: Record<string, string | undefined>) {
    const type = (query.type as AuthIdentityType) || 'OWNER';
    this.setData({
      type,
      typeLabel: titleMap[type],
      result: getAuthResult(type),
    });
  },

  handleResubmit() {
    openRoute(actionMap[this.data.type]);
  },

  handleBackHome() {
    openRoute(ROUTES.home);
  },
});
