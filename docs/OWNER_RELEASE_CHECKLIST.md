# T2PROJECT V2 — Owner / Member release checklist

## Current status
Development branch only. **NOT production-ready.** Do not copy only selected files into the deployed Apps Script project or enable a public Owner page.

## Architecture and blockers
- `apps-script/Code.gs` currently serves only `action=member_portal` from `doGet`. Owner HTML files are prototypes, not live routes.
- `login(payload)` in `Code.gs` deliberately rejects login; the project requires a reviewed authentication mechanism before Owner/Admin production access. Do not bypass this with a hardcoded token, a public owner URL, or a GitHub Pages token.
- `OwnerMemberSummary.html` and `OwnerBankReview.html` still contain manual token fields for internal prototype work. Do **not** use real sessions in those prototype forms.
- Bank request approval only changes the request workflow status; it does **not** verify ownership of an account or update payment instructions. Full account number is not stored.
- Returns/promotion computation and full Admin dashboard remain unimplemented. Do not invent return rates or present the totals as bank-verified.

## Before testing
1. Review the security and login design, with a suitable production identity provider and session handling.
2. Review role boundaries (Owner sees all, Admin only assigned room, Member only own record).
3. Verify that the private Google Sheet has the exact headers expected by `Code.gs` and `OwnerReleasePreflight.gs`.
4. Set `T2_DB_ID` to the approved private database; keep all credentials and personal data out of GitHub.
5. Run `t2OwnerReleasePreflight()` manually from Apps Script editor (read-only).
6. Back up the database before any setup or migrations; run `t2InstallMemberModules()` only after schema review.
7. Use synthetic test members, slips, and bank requests to validate owner/member scoping, duplicate records, missing data, pagination, auditing and printing.
8. Compare slip totals against actual statements before any financial claims. `OwnerMemberSummary` totals are from recorded slips, not independent bank confirmation.
9. Validate mobile layout, Thai Prompt font, text-to-speech requirements, and print format.
10. Only then publish a new GAS deployment and test `/exec` without changing the existing production deployment until acceptance.

## New module files
- OwnerMemberSummary.gs / OwnerMemberSummary.html
- OwnerMemberSearch.gs / OwnerMemberSlips.gs
- OwnerBankQueue.gs / OwnerBankDecision.gs / OwnerBankReview.html
- BankReviewDiagnostics.gs / OwnerReleasePreflight.gs
- MemberBankRequests.gs / MemberModulesSetup.gs

Do not call these modules production-ready merely because they exist in GitHub.

## Implementation progress
- [x] Admin member creation and scoped search
- [x] Receipt entry, scoped reporting and pending/verified-status separation
- [x] Reject duplicate member IDs in reporting and receipt void operations
- [x] Record receipt void status before writing audit entry
- [ ] Review and enable secure authentication for all three roles
- [ ] Implement returns from approved promotion documents
- [ ] Complete synthetic end-to-end tests and financial reconciliation
- [ ] Validate mobile accessibility and printing
- [ ] Stage, accept and deploy production
