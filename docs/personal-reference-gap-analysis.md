# Documentation Reconciliation Analysis (Full Pass)

Date reviewed: 2026-04-05.

Primary source of truth: repository implementation.
Secondary comparison sources: `README.md`, baseline docs in `/docs`, and `docs/personal-app-baseline-reference.md`.

---

## A) Executive summary

Overall state: **partially aligned, with several significant stale areas**.

What is in good shape:
- Admin operations baseline remains mostly aligned with current admin pages.
- Company-owner and driver baseline docs still broadly match page-level access and workflow intent.
- Notification baseline correctly captures most owner notification dedupe/reconciliation rules.

What is stale or conflicting:
- Multiple baseline docs still describe old **truck-user/allowed-truck-driven owner visibility** assumptions that no longer match current routing and visibility logic.
- Several docs still describe legacy driver-assignment “receipt_confirmed_*” behavior, while current code uses `DriverDispatch.delivery_status`, `last_seen_at`, and `last_opened_at` for driver acknowledgement.
- README had factual drift around repo structure and available admin navigation areas.

Bottom line: docs are **not severely broken**, but there are enough stale behavior statements in core baseline references to make refactors risky unless corrected.

---

## B) README discrepancies

### Outdated / inaccurate items found

1. **Entity storage statement was inaccurate**
   - README previously stated Base44 entities “are not stored in this repository.”
   - The repo includes tracked Base44 entity snapshots under `base44/entities/*.jsonc` (and `CopyOfEntities/*` references), so that statement was too absolute.

2. **Project structure block was outdated**
   - README showed a top-level `functions` folder, while actual function code is under `base44/functions`.

3. **Admin navigation list was incomplete**
   - Header/nav includes `SMS Center` and `Driver Protocol` for admin in addition to the prior baseline list.

4. **Driver visibility detail was underspecified**
   - Driver behavior depends on active/visible `DriverDispatch` rows and delivery status (`sent`/`seen`), not just generic “DriverDispatch records.”

5. **Dispatch filtering table wording for owners was misleading**
   - Owner dispatch visibility in current code is company-scoped for portal list visibility, with truck-level action/read status in drawer logic.

### README updates made
- Corrected the entity-storage language.
- Corrected project structure to `base44/entities` + `base44/functions`.
- Expanded admin page list to include `SMS Center` and `Driver Protocol`.
- Clarified driver visibility to active visible driver assignments.
- Clarified owner dispatch visibility wording in filtering section.

---

## C) Baseline discrepancies (doc-by-doc)

### `docs/behavior-preservation-baseline.md`

Still matches:
- Core auth gate and access-code linking flow.
- Admin/owner/driver route guards.
- Dispatch lifecycle high-level behavior.

No longer matches:
- Old references to truck-user behavior as a first-class supported role.
- Old `receipt_confirmed_*` assignment-read model language.
- Allowed-truck-centered owner visibility framing in places where current code is company-scoped + assignment-aware.

Missing:
- Explicit acknowledgement that driver acknowledgement now uses `delivery_status` + `last_seen_at/last_opened_at`.

Action taken:
- Added a 2026-04-05 reconciliation update section clarifying these corrections.

---

### `docs/notifications-behavior-baseline.md`

Still matches:
- Owner status notification dedupe/reconcile behavior.
- Driver update dedupe strategy and category split.
- SMS eligibility split by recipient type and role.

No longer matches:
- Sections describing `DriverDispatch.receipt_confirmed_*` writes during driver seen flow.

Missing:
- Current seen-flow state model: `delivery_status='seen'`, `last_seen_at`, `last_opened_at`.

Action taken:
- Added reconciliation update noting the seen-model migration and preserving all other notification semantics.

---

### `docs/portal-dispatch-drawer-behavior-baseline.md`

Still matches:
- Deep-link open behavior and drawer-centric workflow importance.
- Owner truck replacement workflow significance.
- Incident/report/screenshot role split at a high level.

No longer matches:
- Multiple sections that depend on historical `session.allowed_trucks` owner/truck visibility rules.
- Receipt-confirmed seen-badge model text.
- Truck-user-focused sections that do not reflect currently supported login path.

Missing:
- Explicit current model: owner portal list is company-scoped, driver list is active visible assignment-scoped.
- Current seen badge source: assignment `last_seen_at`.

Action taken:
- Added a reconciliation addendum section listing these as superseding corrections.

---

### `docs/refactor-safety-rules.md`

Still matches:
- Many notification and mutation coupling cautions remain valid.

No longer matches:
- Invariants that explicitly mention owner `allowed_trucks ∩ dispatch.trucks_assigned` in contexts where current behavior is no longer centered on that path.
- Legacy receipt-confirmed wording.

Missing:
- Updated driver seen-state invariants (`delivery_status`, `last_seen_at`).

Action taken:
- Added 2026-04-05 correction notes to supersede stale invariants.

---

### `docs/admin-dispatches-behavior-baseline.md`

Still matches:
- Admin dispatch workflow, locking, live board behavior, and mutation flow are largely accurate.

No longer matches:
- Isolated references to `receipt_confirmed_*` reset language (assignment acknowledgement model moved).

Action taken:
- Added reconciliation note to point to delivery-status acknowledgement model.

---

## D) Personal reference baseline discrepancies (`docs/personal-app-baseline-reference.md`)

This section is high priority and was reviewed carefully.

Still correct:
- App entry pattern: authenticated sign-in + access-code linking screen.
- Admin dashboard summary cards and quick actions.
- Force refresh concept and admin confirmation.
- Admin dispatch lifecycle concepts (create/edit/archive/copy).

Changed from what it says:
- The personal reference still contains older assumptions in sections that imply older role/visibility semantics in places where current implementation has moved to company-scoped owner visibility + assignment-scoped driver visibility.
- Driver acknowledgement internals in baseline references should no longer imply `receipt_confirmed_*` semantics.

Should now be updated there:
- Explicitly document that driver acknowledgement writes `delivery_status` and seen/open timestamps.
- Remove any residual truck-user-as-supported-role assumptions.
- Clarify owner visibility and owner compact availability summary behavior as currently implemented.

Action taken:
- Added a reconciliation update block in the personal reference baseline to document these corrections.

---

## E) Recommended doc updates

### README
- Keep: architecture, role overviews, high-level features.
- Update: repo structure, owner/driver visibility precision, admin page list completeness.
- Remove/replace: absolute “entities not in repo” wording.

### Behavior baselines
- Update immediately:
  - `behavior-preservation-baseline.md`
  - `portal-dispatch-drawer-behavior-baseline.md`
  - `notifications-behavior-baseline.md`
  - `refactor-safety-rules.md`
- Keep unchanged for now:
  - `admin-operations-baseline.md` (mostly aligned)
  - `company-owner-baseline.md` and `driver-baseline.md` (broadly aligned)
- Remove obsolete language:
  - Truck-user supported-role assumptions.
  - `receipt_confirmed_*` assignment acknowledgement references.

### Personal reference baseline
- Keep functional workflow map and page-level structure.
- Update role/visibility and seen-state internals to reflect current code paths.

---

## F) Major behavior changes worth documenting (currently under-documented)

1. **Driver acknowledgement model migration**
   - Driver seen/open is now assignment-delivery-state based (`delivery_status`, `last_seen_at`, `last_opened_at`) rather than receipt-confirmed fields.

2. **Owner visibility model clarification**
   - Owner dispatch list visibility in portal is company-scoped.
   - Driver visibility remains assignment-scoped.

3. **Owner truck edit carry-over behavior**
   - One-for-one truck replacement enforces equal truck count.
   - Current-status confirmations can be carried forward to replacement truck when applicable.
   - Notifications are reconciled/expanded after owner truck changes.

4. **Availability owner compact summary behavior**
   - Owner page uses compact snapshot rows for Today/Tomorrow shifts, including non-operational shift handling (`N/A`) and status display (`Unavailable` vs numeric).

5. **Admin workspace additions**
   - Admin navigation includes `SMS Center` and `Driver Protocol`; these should be part of the baseline references.

---

## Files reviewed in this pass

- `README.md`
- `docs/admin-dispatches-behavior-baseline.md`
- `docs/admin-operations-baseline.md`
- `docs/behavior-preservation-baseline.md`
- `docs/company-owner-baseline.md`
- `docs/driver-baseline.md`
- `docs/notifications-behavior-baseline.md`
- `docs/official-baseline-coverage-audit-2026-03-25.md`
- `docs/personal-app-baseline-reference.md`
- `docs/personal-reference-gap-analysis-2026-03-24.md`
- `docs/portal-dispatch-drawer-behavior-baseline.md`
- `docs/refactor-safety-rules.md`

Key code references used for reconciliation:
- `src/pages/AccessCodeLogin.jsx`
- `src/components/session/useAccessSession.jsx`
- `src/Layout.jsx`
- `src/lib/dispatchVisibility.js`
- `src/pages/Portal.jsx`
- `src/components/portal/DispatchDetailDrawer.jsx`
- `src/services/ownerTruckEditMutationService.js`
- `src/services/driverAssignmentMutationService.js`
- `src/components/notifications/useOwnerNotifications.jsx`
- `src/components/availability/AvailabilitySummaryBoxes.jsx`

