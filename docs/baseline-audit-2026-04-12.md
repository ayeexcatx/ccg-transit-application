# Baseline Audit — 2026-04-12

Date: 2026-04-12  
Primary truth source for this audit: current repository implementation (frontend + Base44 function code in repo snapshot).

## Scope reviewed
This pass reviewed current implementation behavior against the official baseline/doc set, with specific attention to recent high-risk behavior areas.

Reviewed docs:
- `README.md`
- `docs/behavior-preservation-baseline.md`
- `docs/admin-dispatches-behavior-baseline.md`
- `docs/admin-operations-baseline.md`
- `docs/company-owner-baseline.md`
- `docs/driver-baseline.md`
- `docs/notifications-behavior-baseline.md`
- `docs/portal-dispatch-drawer-behavior-baseline.md`
- `docs/refactor-safety-rules.md`

Code areas sampled for verification included (non-exhaustive):
- auth/session/linking and restore (`AccessCodeLogin`, `useAccessSession`, workspace helpers)
- role guards and navigation (`Layout`, `pages.config`)
- dispatch visibility selectors (`dispatchVisibility`)
- notification/confirmation/dedupe logic (`createNotifications`, `ownerActionStatus`, `openConfirmations`)
- SMS gating/composition/rules (`notificationSmsDelivery`, `sms`, `smsDerivedState`, `smsConfig`, `AdminSmsCenter`, `Profile`)
- admin confirmations + driver seen logs (`AdminConfirmations`, `DriverDispatchLog` usage)
- Drive per-truck HTML sync (`dispatchDriveSync`, `dispatchHtml`, sync function entry)

---

## Overall repo vs official baseline alignment
Overall alignment is **strong**, with most critical behavior represented in the official baseline set and largely matching current code.

The previously high-risk areas requested for spot verification are mostly aligned in implementation and documentation:
- access-code one-time linking + restore and role compatibility
- owner identity/session restore behavior
- owner/driver visibility split (company-scoped owner list visibility vs assignment-scoped driver visibility)
- driver seen/ack model using `DriverDispatch.delivery_status` + `last_seen_at` / `last_opened_at`
- admin confirmations with explicit Driver Dispatch Log review surface
- role model and admin page set including SMS Center + Driver Protocol
- Google Drive per-truck HTML sync behavior

---

## Official baseline files reviewed
- `docs/behavior-preservation-baseline.md`
- `docs/admin-dispatches-behavior-baseline.md`
- `docs/admin-operations-baseline.md`
- `docs/company-owner-baseline.md`
- `docs/driver-baseline.md`
- `docs/notifications-behavior-baseline.md`
- `docs/portal-dispatch-drawer-behavior-baseline.md`
- `docs/refactor-safety-rules.md`

---

## Areas fully covered (code-backed)
1. **Access-code login + one-time use + restore constraints**
   - Link flow rejects inactive/used codes and rejects Truck role login.
   - Restore flow rehydrates from stored id, validates active supported role, and reconciles linked identity.
2. **Session restore and owner display identity/workspace behavior**
   - Workspace mode/company restore logic is explicit.
   - Admin display identity resolution and owner workspace derivation are code-backed.
3. **Role model and route guard behavior**
   - Supported role sessions are `Admin`, `CompanyOwner`, `Driver`.
   - Admin/owner route restrictions and admin redirect behavior are enforced in layout logic.
4. **Owner company-scoped vs driver assignment-scoped visibility**
   - Owner dispatch list visibility is company-based.
   - Driver dispatch visibility is assignment-driven from active visible driver assignments.
5. **Driver acknowledgement / seen model**
   - Driver assignment seen/open lifecycle is tracked by `delivery_status`, `last_seen_at`, `last_opened_at` and tied to notification/open flows.
6. **Notification bell/history/action-needed mechanics**
   - Owner effective-read logic uses required-vs-confirmed truck computation, not only stored `read_flag`.
   - click-to-read category behavior is constrained and explicit.
7. **Admin confirmations + Driver Dispatch Log**
   - Confirmations page has dedicated Driver Dispatch Log tab sourced from `DriverDispatchLog` records.
8. **Google Drive per-truck HTML sync behavior**
   - Sync builds one record/file target per assigned truck and tracks metadata/finalization on dispatch.

---

## Areas partially covered / stale in official docs
1. **Admin page list inconsistency in one official baseline file**
   - `behavior-preservation-baseline` admin-only page list omits `AdminSmsCenter` and `AdminDriverProtocol`, while code and other docs include them.
   - This is a documentation mismatch (minor, but concrete).

2. **Notification SMS composition details are partially stale in `notifications-behavior-baseline`**
   - Current code has richer branch behavior (owner status-specific templates and dispatch-linked formatting paths).
   - Existing baseline section still reads as mostly generic title+datetime composition.

3. **Portal baseline has one stale phrasing around owner list filtering**
   - One section still mentions owner list filtering as allowed-truck-driven (legacy framing), while current implementation is company-scoped at list level with truck logic in action/detail contexts.

---

## Areas missing from official baselines
No major missing top-level baseline coverage was found for currently implemented core workflows.

However, baseline maintainability would improve by splitting one overloaded concern into its own file (see recommendation below).

---

## Code-vs-official-baseline mismatches (major/minor)
### Major mismatches
- **None identified** in this pass.

### Minor/documentary mismatches
1. Admin page list omission (`AdminSmsCenter`, `AdminDriverProtocol`) in one baseline file section.
2. SMS composition details in `notifications-behavior-baseline` lag current implementation detail.
3. One stale owner list visibility phrasing in `portal-dispatch-drawer-behavior-baseline` conflicts with current company-scoped list behavior.

---

## Suggested new baseline docs, if any
### Recommended (not created in this pass)
**`docs/access-session-linking-baseline.md`**

Why this now deserves a dedicated baseline:
- Access-code login, one-time-use claiming, linked-identity backfill, workspace switching, and restore compatibility checks are now dense and high-risk.
- Behavior is currently spread across large docs and session/auth files, making future refactor validation harder.
- This area has direct impact on auth integrity and cross-role safety.

Suggested scope:
- login/link lifecycle
- one-time-use claim rules
- restore and fallback resolution order
- linked identity compatibility rules
- workspace selection persistence and redirect behavior
- known manual-verification items for backend enforcement boundaries

---

## Needs manual verification / preserved testing notes
Preserved (still applicable):
- Backend-side role enforcement beyond client route guards and query filters.
- Runtime/browser variability for install prompt and long-session refresh prompts.
- End-to-end production validation for SMS provider behavior and policy toggles.
- Any server-side policy/SLA expectations not encoded in client logic (confirmations/escalation semantics).

No existing “needs manual verification” categories were removed in this audit unless they were clearly obsolete.

---

## Coverage outcome / summary
- Official baseline set is broadly aligned with current code.
- No major behavior conflicts were found.
- Minor documentation drift exists in a few targeted sections and should be corrected in a follow-up documentation cleanup pass.
- A dedicated access/session/auth baseline is now justified for maintainability and refactor safety.
