export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'autonomy-user-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET ?? 'autonomy-admin-secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '7d',
  },
  adminAuth: {
    bootstrapEmail: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    bootstrapPassword: process.env.ADMIN_PASSWORD ?? '1234',
  },
  wechat: {
    appId: process.env.WECHAT_APPID ?? 'demo-appid',
    secret: process.env.WECHAT_SECRET ?? 'demo-secret',
  },
});
