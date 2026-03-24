# Task Plan: Mini Program List Loading Unification

## Goal
Unify mini program list pages and list panels onto the new shared loading interaction so they all use the same pull-to-refresh and load-more pattern.

## Current Phase
Phase 5

## Phases
### Phase 1: Scope Discovery
- [x] Scan current mini program list pages and panels
- [x] Identify reusable list infrastructure gaps
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Shared Infrastructure
- [x] Repair shared list infrastructure (`useList`, `app-list`, `EventEmitter`, props)
- [x] Verify mini program build passes with infrastructure changes
- **Status:** complete

### Phase 3: High-Traffic Public Lists
- [x] Convert disclosure and voting list surfaces to `app-list`
- [x] Add paging and refresh logic to pages/components
- **Status:** complete

### Phase 4: Profile And Service Lists
- [x] Convert profile/service list pages to `app-list`
- [x] Standardize refresh/load-more handlers on local data lists
- **Status:** complete

### Phase 5: Verification And Cleanup
- [x] Re-scan for remaining list pages not using shared logic
- [x] Run mini program build
- [x] Summarize residual gaps if any
- **Status:** complete

## Key Questions
1. Which mini program pages should count as a list surface that must use the shared loading logic?
2. Which pages have real remote pagination versus local/mock lists that need client-side paging only?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use `app-list` as the required shared container for list UI | Gives one place for pull refresh, load more, empty, and finish states |
| Keep `useList` as the shared async list state primitive, but not force it into `Page()` definitions | Mini program `Page` cannot directly consume behaviors like components can |
| Use client-side paging for current local/mock lists | Fastest way to unify interaction without inventing fake backend pagination |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Missing `EventEmitter` and external `createComponent` dependency blocked build | 1 | Added local `EventEmitter`, removed external `createComponent` dependency from `app-list` |
| `tdesign-miniprogram/loading/index` type import failed | 1 | Replaced with local plain object typing in `constants/props.ts` |

## Notes
- Continue scanning list surfaces after each batch to avoid missing pages.
- Prefer converting repeated-card and repeated-cell pages; ignore non-list repeaters like tab bars, vote option rows, and form option groups.
