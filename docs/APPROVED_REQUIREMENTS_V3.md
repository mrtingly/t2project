# T2PROJECT V3 — Approved requirements baseline

Status: **requirements baseline, not a claim of completed implementation**. Preserve the existing live Apps Script deployment, existing spreadsheet, and backup. No resets, destructive schema initialization, or untested production deployment.

## Product purpose
Private member administration, receipt evidence, payment allocation, verification, reporting, and member self-service. Public pages must not expose member records, program amounts, return formulas, or internal program terms.

## Roles and boundaries
- **Owner:** All eight rooms, aggregate dashboard, statement import/reconciliation, audit, printable room/month/member reports, and management of internal program rules.
- **Admin:** Only assigned room; create/search members, review and record receipts, correct mistakes with audit, assign payments and rights, and process recovery KYC. No original confirmed slip viewing and no print menu. Never read or set a member password.
- **Member:** Only own profile, allocations, payment records, originals and printing; edit permitted contact fields, maintain emergency contacts and beneficiaries, and submit hardship reports. No other member's data.
- Every server endpoint MUST authenticate and authorize access. Never trust role, room or member IDs supplied by the browser.

## Rooms
Eight rooms: R001 A+, R002 A, R003 B, R004 C, R005 D, R006 E, R007 F, R008 G. Keep existing Admin assignment records; do not publish passwords or identity documents.

## Enrollment and authentication
1. Admin creates a member record using prefix-free first/last name and verified 13-digit national ID. Check for existing member across all rooms before creating.
2. First entry matches Admin-created record and requires independent identity verification before access to private records; name/ID alone are not authentication.
3. Member sets own username and password. Subsequent entry uses credentials, not name/ID.
4. Forgotten credentials: assigned Admin records KYC, grants one-use short-lived recovery, member resets own credentials, revoke old sessions, and audit.
5. Use secure password KDF, rate limits, session expiry, encrypted sensitive identity storage and managed keys. Do not publish secrets in GitHub.

## Member profile
Photo, full name, national ID (protected), phone, email, bank details, address, map pin, at least two emergency contacts, unlimited beneficiaries with allocation percentages and validation. Self-service print of authorized profile and receipts. Profile completion reminders.

## Receipt workflow
- Admin selects member and uploads 1–5 images per batch. Show image alongside editable extracted fields.
- Bank transfer and 7-Eleven Counter Service receipts supported. OCR is an assistant, never sole verification; support manual input where OCR is unavailable.
- Record paid date/time, payer, receiver, amount, bank/channel, receipt/reference number, notes, source image, responsible Admin.
- Check duplicates within batch and across rooms using reference, time, payer/receiver and file fingerprint; route ambiguous matches to review.
- One original receipt may be allocated among multiple beneficiaries without exceeding receipt total; preserve payer vs beneficiary identity.
- Keep original immutable, log corrections and who made them, and invalidate stale verification after critical changes.

## Bank reconciliation
Owner imports supported statement formats for BBL, BAY, SCB, GSB and KBANK. Handle Counter Service delayed/batched settlement separately. Matching requires evidence from statement, not just OCR; track matched/review/unmatched.

## Internal programs
Program terms, amounts, calculations and claimed outcomes are **internal-only**. Do not publish in README, public website, unauthenticated APIs or public GitHub source. Keep existing internal tables/data and enforce authorization server-side. Program calculation and reporting must be based on approved internal rules and actual allocation dates; do not invent promotional terms or numeric returns.

## Reporting and printing
Member can print own authorized information and slips, exactly two original slips per portrait A4 sheet. Owner can print all rooms or filter by room, member, period and Admin. Admin has no print menu. Reports include payment timestamp, payer, receiver, receipt reference, amount, allocations and reconciliation status.

## Interface
Mobile-first, Prompt font, large accessible controls, back navigation, easy-to-understand Thai text, optional text-to-speech on key pages/actions, and desktop/mobile parity. Public landing page is login-only.

## Safety and release gates
- No real national IDs, credentials, receipts, program numbers or statements in public GitHub.
- Preserve live deployment and database; verify backup before migration.
- Tests must cover role isolation, duplicate receipts, allocation sum, recovery, audit, statement matching, private file access, print pagination, mobile layout.
- A GitHub commit is **not** an Apps Script deployment. No claim of completed functionality without verified end-to-end tests.
- Do not run empty-database initializers against the existing production spreadsheet.

## Implementation priority
1. Audit actual deployed source against repository; identify exact sync gaps without deleting existing assets.
2. Secure authentication/session and room/member access enforcement.
3. Admin enrollment and Member profile.
4. Receipt capture, duplicate detection and allocation.
5. Owner statement reconciliation and reporting.
6. Printing, accessibility, comprehensive tests, controlled deployment.

Any change to these approved requirements should be explicit and recorded, rather than inferred from a code placeholder.
