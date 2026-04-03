# Task Plan: Backend/Admin Skeleton Reset

## Goal
Remove all backend business tables and API modules, remove all admin pages except a single home page while preserving the shell, delete the WeChat mini program and related references, and move `backend` and `admin-web` from `autonomy/` to the repository root.

## Current Phase
Phase 1

## Phases
### Phase 1: Scope And Retention Boundary
- [ ] Confirm which backend pieces are framework-only and can stay
- [ ] Confirm which admin shell pieces can stay for a single home page
- [ ] Document migration impact in findings.md
- **Status:** in_progress

### Phase 2: Backend Skeleton Reduction
- [ ] Remove Prisma schema models and business modules/controllers
- [ ] Keep only minimal Nest bootstrap and a basic health endpoint
- [ ] Trim configuration to framework-safe defaults
- **Status:** pending

### Phase 3: Admin Shell Reduction
- [ ] Remove business routes, views, modules, and auth flow
- [ ] Keep layout shell and a single home page
- [ ] Ensure the admin app still builds
- **Status:** pending

### Phase 4: Mini Program Removal And Root Relocation
- [ ] Delete `autonomy/wechat` and related references/scripts
- [ ] Move `autonomy/backend` to `/backend`
- [ ] Move `autonomy/admin-web` to `/admin-web`
- [ ] Remove obsolete `autonomy` aggregator files if no longer needed
- **Status:** pending

### Phase 5: Verification And Cleanup
- [ ] Re-scan repository structure
- [ ] Run backend and admin build verification
- [ ] Update planning files with final results
- **Status:** pending

## Key Questions
1. Framework retention for backend: keep only Nest bootstrap plus health check, or also keep Prisma wiring with empty schema?
2. Framework retention for admin: keep sidebar/topbar shell and one landing page, or keep login as well?

## Working Decisions
| Decision | Rationale |
|----------|-----------|
| Backend will be reduced to a minimal Nest skeleton with health endpoint only | Satisfies "keep framework" without retaining business APIs or database coupling |
| Admin will keep the existing shell layout and a single home route | Matches "keep framework, leave homepage" while removing business pages |
| WeChat mini program will be removed entirely, not merely disabled | User explicitly asked to delete the directory and related content |
| `backend` and `admin-web` will become top-level directories | User explicitly asked to place them at repository root |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `git status` failed with dubious ownership on `E:/ai-work/project` | 1 | Switched to direct file inspection and `git -c safe.directory=...` for read-only git access |

## Notes
- Avoid preserving stale auth, Prisma, or business-specific configuration when it no longer supports any retained feature.
- Prefer ASCII edits for touched files because several current files show encoding issues in terminal output.
