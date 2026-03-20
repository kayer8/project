import { currentUser, members, profileHouses, verificationRecord } from '../../mock/community';

Page({
  data: {
    user: currentUser,
    houses: profileHouses,
    members,
    verification: verificationRecord,
  },
});
