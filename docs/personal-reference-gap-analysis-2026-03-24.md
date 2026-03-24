# Personal Baseline Gap Analysis (Implementation vs Reference)

Date reviewed: 2026-03-24.

Reference used for comparison: `docs/personal-app-baseline-reference.md` (secondary).  
Source of truth: current repository implementation (primary).

## 1) Missing baseline areas in `/docs` before this update

These major areas lacked dedicated focused docs (outside the broad all-in-one references):
- Admin Dashboard
- Admin Availability
- Admin Announcements
- Admin Companies
- Admin Access Codes
- Admin Template Notes
- Admin Profile
- Company Owner Home
- Company Owner Availability
- Company Owner Drivers
- Company Owner Notifications
- Company Owner Profile
- Driver Home
- Driver Profile
- Driver Incidents

## 2) New baseline docs created

- `docs/admin-operations-baseline.md`
- `docs/company-owner-baseline.md`
- `docs/driver-baseline.md`

## 3) Behavior present in code but missing from personal baseline

- Admin Dashboard upcoming card logic includes Fri/Sat/Sun rollover to Monday.
- Force App Refresh requires admin-code re-confirmation before version bump.
- Admin announcements maintain structured admin activity log entries.
- Admin access codes support multi-workspace admin behavior (`available_views`, `linked_company_ids`).
- Owner/driver notification read state includes computed effective read behavior (not just stored `read_flag`).
- Driver incidents page hides top-level create button for drivers while still allowing dispatch-drawer initiated creation.
- Driver incident truck prefill is conditional, not absolute.
- Company and owner profile flows are heavily based on typed `contact_methods` and SMS contact designation.

## 4) Conflicts between code and personal baseline

- **Admin dashboard upcoming logic**: reference says Friday-only Monday behavior; code applies Monday preview on Friday, Saturday, and Sunday.
- **Header second-line identity semantics**: reference expects user name; code emphasizes workspace/role label in the persistent header.
- **Driver incident prefill expectation**: reference wording suggests assigned truck prefill; code only pre-fills truck when uniquely determined.

## 5) Potential bugs, inconsistencies, or risky areas

- **Potential completion-control gap (Incidents)**: UI warns to save restart time before completion, but status mutation path is not hard-blocked by visible frontend check at mutation level.
- **Potential wording/behavior drift**: several long instructional text blocks in Drivers page can diverge from actual workflow logic over time.
- **Complex read-state logic risk**: owner notifications depend on computed effective-read state combining notifications, confirmations, and truck visibility; regression risk is high without focused tests.
- **Admin SMS ambiguity risk**: profile stores admin SMS preference while UI says delivery is not active; this can confuse operators unless policy is explicit.

## 6) Needs manual verification (cross-cutting)

- Runtime force-refresh timing consistency across background tabs/devices.
- Incident completion backend validation constraints.
- Notification load behavior under high-volume production data.
- Policy-level correctness of scoring formulas and instructional guidance text.

