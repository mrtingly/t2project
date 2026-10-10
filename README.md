# T2PROJECT V3 — System blueprint

Status: architecture baseline, not production-ready. No real member data or credentials in this repository.

## Architecture
- Static responsive frontend hosted on GitHub Pages, Prompt font.
- Google Apps Script API validates every authenticated request and room access.
- Google Sheets is the structured datastore; private Google Drive stores original receipts and ID images.
- Roles: MEMBER, ADMIN (S001–S008 mapped to A+, A, B, C, D, E, F, G), OWNER.
- Never store credentials, ID photos, national ID numbers, bank statements or private slip images in public GitHub or client-side storage.

## Sheets / data dictionary
| Sheet | Main columns |
|---|---|
| Rooms | room_id, room_name, admin_user_id |
| Users | user_id, role, room_id, member_id, username, password_hash, password_salt, status, created_at |
| Members | member_id, room_id, first_name, last_name, national_id_encrypted, phone, email, address, map_location, bank_details, id_image_drive_id, created_by, status |
| EmergencyContacts | contact_id, member_id, name, phone, relationship |
| Beneficiaries | beneficiary_id, member_id, name, national_id_encrypted, phone, percentage |
| Slips | slip_id, room_id, payment_channel (BANK_TRANSFER / SEVEN_ELEVEN_COUNTER_SERVICE), original_payer_name, bank, paid_at, amount, reference, counter_service_receipt_number, terminal_or_branch, receiver, original_drive_id, fingerprint, created_by, status, verified_bank_entry_id, created_at |
| SlipAllocations | allocation_id, slip_id, beneficiary_member_id, payer_member_id, allocation_type, amount, rights_count, period_yyyy_mm, note |
| Programs | program_id, effective_from, effective_to, source_reference, amount_basis, claimed_monetary_outcome, fallback_flag, terms |
| MemberProgramResults | result_id, allocation_id, program_id, program_contribution, admin_fee, claimed_result, calculation_status |
| HardshipReports | report_id, member_id, room_id, period_yyyy_mm, reason, details, acknowledged_at, status |
| Statements | statement_id, bank, statement_account, date_from, date_to, imported_by, source_drive_id, imported_at |
| BankEntries | entry_id, statement_id, booked_at, amount, direction, reference, counterpart, fingerprint, matched_slip_id, status |
| AuditLog | audit_id, actor_id, action, object_type, object_id, before_json, after_json, at |

## Receipt flow
1. Admin chooses one member, then uploads 1–5 slips.
2. Compare exact identifiers and file fingerprints against existing slips and against this batch. Reject confirmed duplicates; send uncertain cases to review.
3. OCR supports both mobile banking slips and 7-Eleven / Counter Service receipts; it extracts date, time, amount, reference/receipt number, receiver and branch/terminal when present. Admin checks and corrects before saving. Never require a bank-style reference on a Counter Service receipt if it does not exist.
4. One slip can be allocated to one or more members. Sum of allocations must not exceed actual receipt amount. Distinguish own payment, room support and payment on behalf of named member.
5. Admin may correct mistaken member assignment and slip metadata; retain an automatic audit trail. Original image is immutable. Admin does not view original confirmed images.
6. Member can review own allocations and original slips through authorized API.
7. Owner imports statement and reconciles incoming entries. Never mark as bank-verified from slip/OCR alone; a bank entry can match at most one original slip. Edited critical fields invalidate prior reconciliation until checked again.

## Account recovery after forgotten username/password
- Member contacts their assigned room Admin. Admin performs and records KYC BEFORE approving recovery; name + national ID alone do not count as KYC.
- Admin may approve recovery ONLY for a member in their own room, and must record actor, KYC method, timestamp and reason in AuditLog. Admin cannot view or set the member's password.
- Approval creates a short-lived, one-use recovery authorization. It temporarily enables initial entry with prefix-free first name + last name + 13-digit national ID for THAT member only, with rate limiting and generic failure messages.
- After successful temporary entry, permit ONLY username/password reset; do not reveal profile, financial data or original ID/slip images.
- Require member to choose new credentials; store only a suitably salted KDF password hash, invalidate old sessions, consume recovery authorization and immediately disable name+ID entry again.
- If authorization expires or attempts exceed limit, member must contact Admin for fresh KYC.
- This is a required workflow, NOT yet a deployed or verified authentication implementation.

## Statement imports
Banks: Bangkok Bank, Bank of Ayudhya, Siam Commercial Bank, Government Savings Bank, Kasikornbank.
CSV/XLSX import where supported; PDF only after testing actual bank-specific formats. Counter Service payments may settle later or in batches: retain the payment channel and receipt identity, and route batch/delayed deposits to Owner review instead of falsely declaring unmatched payments missing. Reconciliation states: matched, review, unmatched. Owner can view all rooms and resolve ambiguity.

## Printing
- Member: print all or selected profile data, payment history, allocated rights (if recorded), and selected original slips.
- Slips: exactly 2 per portrait A4 sheet, each with image, timestamp, amount, rights, reference, payer, on-behalf-of member and notes where applicable.
- Admin: no print menu.
- Owner: print a selected room or all eight rooms, filtered by month.

## Security / release requirements
- Authenticate server-side; check room membership on every endpoint, not just UI.
- Admin creates member record first (first name, last name, 13-digit Thai national ID; never a title/prefix). Initial entry uses those three fields to locate the record. After verification, member creates their own username/password. On successful credential setup, permanently disable name+ID initial entry for that member; subsequent logins use username/password only. Because name+ID are not secrets, protect initial entry with independent verification, rate limiting and anti-enumeration, and do not expose financial or identity records until verification succeeds.
- Password hashing with unique salt and a suitable KDF; rate limiting and session expiry.
- Sensitive identity data should not be put into a broadly shared Sheet without appropriate access controls and encryption/key management.
- Audit edits and statement matching; use concurrency locks for receipt uniqueness and allocation consistency.
- Test with synthetic data before production; do not claim OCR or reconciliation is perfect.

## Next implementation phases
1. Create fresh spreadsheet + private Drive folders and securely configure Apps Script properties.
2. Implement backend authentication/authorization, member CRUD, slip uniqueness, allocations and audit.
3. Build Admin-first member registration, initial name+ID entry with independent verification, one-time username/password setup and username/password-only subsequent login.
4. Integrate OCR provider and statement parsers using sample files from each bank.
5. Add A4 print styles and end-to-end tests.
