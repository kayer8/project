interface IAppOption {
  globalData: {
    accessToken: string;
    sessionUser: import('../store/app').SessionUser | null;
  };
}
