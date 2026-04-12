# Personal Reference Gap Analysis

Date: 2026-04-12

## Scope reviewed
Compared:
- `docs/personal-app-baseline-reference.md`
- official baseline set in `docs/`

Official baselines used for comparison:
- `docs/behavior-preservation-baseline.md`
- `docs/admin-dispatches-behavior-baseline.md`
- `docs/admin-operations-baseline.md`
- `docs/company-owner-baseline.md`
- `docs/driver-baseline.md`
- `docs/notifications-behavior-baseline.md`
- `docs/portal-dispatch-drawer-behavior-baseline.md`
- `docs/refactor-safety-rules.md`

Personal baseline is treated as owner-intent reference and compared separately against the official set.

---

## Overall alignment between personal reference baseline and official baselines
Overall alignment is **good at the core behavior level** (roles, owner vs driver visibility model, driver seen model, admin confirmations coverage, and high-level notification behavior).

There are still **targeted content conflicts/stale sections** inside the personal reference document due to legacy text and uneven section updates.

---

## Items still fully aligned
1. Supported current role model at the top-level intent section (`Admin`, `CompanyOwner`, `Driver`).
2. Owner list visibility intent as company-scoped, with truck-specific logic in drawer/notification/per-truck action contexts.
3. Driver visibility intent as assignment-scoped.
4. Driver acknowledgement intent based on `DriverDispatch` seen/open fields (not a separate receipt-confirmed button flow).
5. Admin review intent for driver acknowledgement history through **Admin Confirmations → Driver Dispatch Log**.

---

## Items missing from personal reference baseline (relative to official baselines)
1. Personal baseline does not consistently document the modern access/session restore/linking sequence with enough precision (restore compatibility checks, linked-identity fallback order, shared-admin linkage behavior).
2. Personal baseline does not consistently capture owner notification effective-read mechanics based on required-vs-confirmed trucks.
3. Personal baseline does not consistently call out the current dedupe-critical notification key behavior in the same explicit way as official baselines.

---

## Items conflicting with personal reference baseline
1. **Stale Truck-role references remain in multiple sections**
   - Personal baseline still includes sections listing Truck role as if present in active Access Code admin flows.
   - This conflicts with official/current behavior where Truck login is deprecated/blocked.

2. **Admin SMS wording remains over-broad in some sections**
   - Personal baseline still frames admin SMS as active operational recipient behavior in places.
   - Official baseline/current implementation treats admin SMS as configurable/shared-profile infrastructure, but not the primary dispatch notification workflow path in current operations docs.

3. **Internal section inconsistency around visibility wording**
   - Personal baseline contains both updated company-scoped owner visibility language and some older assignment-style/legacy phrasing in deep sections, which can create ambiguity for refactor audits.

---

## Recommended additions to the personal reference baseline
1. Add a short dedicated section summarizing **access-code/session/linking restore order** (login claim, restore compatibility checks, linked-identity resolution, workspace persistence).
2. Add explicit subsection for **owner notification action-needed logic** (required trucks, confirmation matching, effective-read vs stored `read_flag`).
3. Remove or quarantine remaining Truck-role operational text into a clearly marked historical appendix.
4. Normalize admin SMS wording so it distinguishes:
   - shared admin SMS profile/rules configuration behavior, vs
   - current dispatch notification recipient workflows.
5. Add one concise cross-link table mapping personal sections to official baseline files to reduce drift in future updates.

---

## Whether any unresolved owner-review issues remain
- **No major unresolved owner-intent conflicts** were identified.
- **Minor editorial owner review is still recommended** to approve removal/rewording of remaining legacy Truck/admin-SMS phrasing in the personal reference document.
