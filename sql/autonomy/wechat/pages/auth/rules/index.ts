import { getAuthRules } from '../../../services/mock';
import type { AuthIdentityType } from '../../../services/mock';

const titleMap: Record<AuthIdentityType, string> = {
  OWNER: '业主认证说明',
  TENANT: '租户认证说明',
  COMMITTEE: '委员会认证说明',
};

Page({
  data: {
    sections: [] as Array<{ title: string; rules: string[] }>,
    reminders: [
      '审核周期通常为 1 至 3 个工作日，复杂关系会进入人工复核。',
      '驳回后可根据原因补充资料并重新提交。',
      '上传资料仅用于审核，不在居民端公开展示。',
    ],
  },

  onLoad() {
    const rules = getAuthRules() as Record<AuthIdentityType, string[]>;
    this.setData({
      sections: (Object.keys(rules) as AuthIdentityType[]).map((type) => ({
        title: titleMap[type],
        rules: rules[type],
      })),
    });
  },

  handleCallManager() {
    wx.showModal({
      title: '联系管理员',
      content: '可联系社区管理员电话 400-886-1008 进行咨询。',
      showCancel: false,
    });
  },
});
