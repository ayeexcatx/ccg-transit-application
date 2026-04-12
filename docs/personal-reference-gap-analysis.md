# Personal Reference Gap Analysis (Post-Cleanup)

Date: 2026-04-12
Compared documents:
- `docs/personal-app-baseline-reference.md`
- Official baseline set in `/docs`

## Resolved in this cleanup
- Removed stale current-role language that treated `Truck` as a supported login role; current supported access-code roles are `Admin`, `CompanyOwner`, and `Driver`.
- Aligned owner visibility language to company-scoped list visibility, with truck-scoped logic retained in drawer/notification detail workflows.
- Replaced stale driver `receipt_confirmed_*` acknowledgement wording with current `DriverDispatch` seen/open model (`delivery_status`, `last_seen_at`, `last_opened_at`).
- Aligned notification/SMS time wording: CompanyOwner uses dispatch main/earliest start time; Driver uses assigned-truck effective start time.
- Added/confirmed Admin Confirmations coverage for Driver Dispatch Log acknowledgement history review.
- Confirmed admin page-set documentation includes SMS Center and Driver Protocol.

## Remaining gaps/conflicts
- No remaining major baseline conflicts were found in this pass.

## Requires Owner Review
- None identified from this documentation reconciliation pass.

## Notes on preserved verification items
- Existing “needs manual verification / needs testing” items were preserved in baseline docs unless the owner-approved clarifications explicitly resolved the underlying discrepancy.
