const STORAGE_KEYS = {
  accessToken: 'autonomy_access_token',
  sessionUser: 'autonomy_session_user',
  pendingRegisterProfile: 'autonomy_pending_register_profile',
  currentHouseId: 'autonomy_current_house_id',
  currentRole: 'autonomy_current_role',
};

export interface SessionUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  mobile: string | null;
  realName?: string | null;
}

export interface PendingRegisterProfile {
  nickname: string;
  avatarUrl: string;
}

function syncGlobalData() {
  const app = getApp<IAppOption>();
  if (!app?.globalData) {
    return;
  }

  app.globalData.accessToken = wx.getStorageSync(STORAGE_KEYS.accessToken) || '';
  app.globalData.sessionUser = wx.getStorageSync(STORAGE_KEYS.sessionUser) || null;
  app.globalData.currentHouseId = wx.getStorageSync(STORAGE_KEYS.currentHouseId) || '';
  app.globalData.currentUserRole = wx.getStorageSync(STORAGE_KEYS.currentRole) || '';
}

export const appStore = {
  initialize() {
    syncGlobalData();
  },
  hasAccessToken() {
    return Boolean(wx.getStorageSync(STORAGE_KEYS.accessToken));
  },
  getAccessToken() {
    return wx.getStorageSync(STORAGE_KEYS.accessToken) || '';
  },
  setAccessToken(accessToken: string) {
    if (accessToken) {
      wx.setStorageSync(STORAGE_KEYS.accessToken, accessToken);
    } else {
      wx.removeStorageSync(STORAGE_KEYS.accessToken);
    }
    syncGlobalData();
  },
  getSessionUser(): SessionUser | null {
    return wx.getStorageSync(STORAGE_KEYS.sessionUser) || null;
  },
  setSessionUser(user: SessionUser | null) {
    if (user) {
      wx.setStorageSync(STORAGE_KEYS.sessionUser, user);
    } else {
      wx.removeStorageSync(STORAGE_KEYS.sessionUser);
    }
    syncGlobalData();
  },
  getPendingRegisterProfile(): PendingRegisterProfile | null {
    return wx.getStorageSync(STORAGE_KEYS.pendingRegisterProfile) || null;
  },
  setPendingRegisterProfile(profile: PendingRegisterProfile | null) {
    if (profile) {
      wx.setStorageSync(STORAGE_KEYS.pendingRegisterProfile, profile);
    } else {
      wx.removeStorageSync(STORAGE_KEYS.pendingRegisterProfile);
    }
  },
  clearSession() {
    wx.removeStorageSync(STORAGE_KEYS.accessToken);
    wx.removeStorageSync(STORAGE_KEYS.sessionUser);
    wx.removeStorageSync(STORAGE_KEYS.pendingRegisterProfile);
    wx.removeStorageSync(STORAGE_KEYS.currentHouseId);
    wx.removeStorageSync(STORAGE_KEYS.currentRole);
    syncGlobalData();
  },
  getCurrentHouseId() {
    return wx.getStorageSync(STORAGE_KEYS.currentHouseId) || '';
  },
  setCurrentHouseId(houseId: string) {
    if (houseId) {
      wx.setStorageSync(STORAGE_KEYS.currentHouseId, houseId);
    } else {
      wx.removeStorageSync(STORAGE_KEYS.currentHouseId);
    }
    syncGlobalData();
  },
  getCurrentRole() {
    return wx.getStorageSync(STORAGE_KEYS.currentRole) || '';
  },
  setCurrentRole(role: string) {
    if (role) {
      wx.setStorageSync(STORAGE_KEYS.currentRole, role);
    } else {
      wx.removeStorageSync(STORAGE_KEYS.currentRole);
    }
    syncGlobalData();
  },
};
