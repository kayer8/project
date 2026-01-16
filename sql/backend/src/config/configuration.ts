export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET,
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET,
    baseUrl: process.env.WECHAT_BASE_URL ?? 'https://api.weixin.qq.com',
    grantType: process.env.WECHAT_GRANT_TYPE ?? 'authorization_code',
  },
});
