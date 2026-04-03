# Findings & Decisions

## Requirements
- User wants all mini program lists to use the same shared loading logic.
- The shared logic should be the new `app-list` pull-to-refresh and load-more interaction.
- `useList.ts` and `app-list` must be the common basis.

## Research Findings
- Mini program pages are mostly plain `Page({})`, so they cannot directly consume `Behavior` the same way components do.
- Components such as `tab-panels/disclosure-panel` and `tab-panels/voting-panel` can be migrated more directly to shared list behavior/patterns.
- Many mini program list pages are still local/mock arrays, so unified client-side paging is the pragmatic approach.
- Current repeat-based list surfaces found under `pages/` and `components/` include disclosure pages, profile member/agent/permissions/bind pages, service pages, and voting/disclosure tab panels.
- After migration, the remaining `wx:for` blocks that are not inside `app-list` are fixed navigation cards, vote options/results, form option rows, and the bottom tab bar.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Shared container is `components/app-list` | Centralizes pull refresh, load more, loading, empty, and finish display |
| `useList` remains for behavior-capable components and as the reference state model | Preserves the requested shared loading semantics |
| Local/mock list pages will use the same interaction with client-side slicing | Keeps UX consistent without waiting for backend endpoints |
| Fixed navigation groups are not forced into `app-list` | They are menu blocks, not pageable data lists |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Reference project path initially failed due wrong file name assumption | Located actual `list.ts` and `list.wxml` files via `rg` |
| Existing mini program build had unrelated infra errors | Fixed shared infra first so later page conversions can be validated |

## Resources
- `E:\ai-work\project\sql\autonomy\wechat\behaviors\useList.ts`
- `E:\ai-work\project\sql\autonomy\wechat\components\app-list\app-list.ts`
- `E:\work\project\kmer_card_wechat_lite\packages\shared\src\pages\home\news\list\list.ts`
- `E:\work\project\kmer_card_wechat_lite\packages\shared\src\components\km-list\km-list.ts`

## Additional Findings: Admin Owner Reviews
- Admin owner review page (`admin-web/src/views/owner/review.vue`) was still using mock data and had no real backend integration.
- Backend already had owner result-list capability via `admin/v1/owners`, but no dedicated registration request review queue endpoint.
- The real review source for mini program house binding is `registration_requests`, not `identity_applications`.
- Approval must do more than flip status: it needs to activate or create the `house_member_relations` record so the user actually gains the house binding after review.

## Visual/Browser Findings
- Current list pages mostly render `record-card` loops directly in page bodies without shared list container.
- `app-list` is now buildable and suitable as the wrapper for these repeated list blocks.

## Additional Findings: Skeleton Reset And Relocation
- Current repository root is mostly a wrapper; the actual products live under `autonomy/backend`, `autonomy/admin-web`, and `autonomy/wechat`.
- `autonomy/package.json` is an aggregator script layer that starts `backend` and `admin-web` from subdirectories.
- Backend framework-safe retention boundary is small: `src/main.ts`, `src/app.module.ts`, config validation, common response/error wrappers, and `modules/health`.
- Backend currently depends on Prisma plus many domain modules; keeping Prisma would preserve unnecessary database coupling after table/API removal.
- Admin framework-safe retention boundary is also small: `src/main.ts`, router bootstrap, shared layout files, styles, and a simplified menu config.
- Admin routes currently redirect to `/votes/list` and enforce login through a route guard, so route/auth cleanup is required to leave only a home page.
- Moving `backend` and `admin-web` to repository root will require removing or replacing the obsolete `autonomy` wrapper package.
