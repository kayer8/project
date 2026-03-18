# backend2

Street booth backend focused on 「出摊会话 + 定位 + 异常」 with C/B/Admin roles.

## Quick start
- Copy `.env.example` to `.env` and set `DATABASE_URL` (MySQL) and `PORT`.
- Install deps and generate client: `cd backend2 && npm install`.
- Sync schema: `npx prisma migrate dev --name init` (or `prisma db push`).
- Run service: `npm run start:dev` (Swagger at `/docs`).

## Identity hints
- User APIs expect `x-user-id` header (or `user_id` query/body) for favorites.
- Vendor APIs expect `x-vendor-id` header (or `vendor_id`) and optional `booth_id` when a vendor owns multiple booths.
- Admin resolve uses optional `x-admin-id`.

## Key routes
- 用户端: `GET /api/booths/map`, `GET /api/booths`, `GET /api/booths/:id`, `POST/DELETE /api/favorites/:boothId`.
- 摊主端: `POST /api/vendor/session/start`, `POST /api/vendor/location/report`, `POST /api/vendor/session/:id/pause`, `POST /api/vendor/session/:id/end`, `GET /api/vendor/sessions`.
- 管理端: `GET /admin/dashboard/summary`, `GET /admin/booths/realtime`, `GET /admin/anomalies`, `POST /admin/anomalies/:id/resolve`.
