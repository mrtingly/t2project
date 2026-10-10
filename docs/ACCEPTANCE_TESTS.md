# T2PROJECT V3 — Acceptance tests (synthetic data only)

## Receipt capture
- Upload 5 items mixing bank transfers and 7-Eleven/Counter Service receipts: exactly 5 review forms.
- Repeat same image or exact bank transaction reference in a batch: reject confirmed duplicate.
- Repeat receipt already saved in a different room: reject confirmed duplicate.
- Same amount/date with different valid receipt references: do not automatically reject.
- Counter Service receipt without a bank-style reference: use available receipt/terminal metadata and require human review if ambiguous.
- OCR misreads date, amount or payer: Admin can correct BEFORE save.
- Allocate one 700 THB receipt as 350 THB self + 350 THB on behalf of another member: total bank receipts remain 700 THB, not 1,400 THB.
- Editing a confirmed slip preserves immutable original and audit history.

## Authorization
- Admin S001 cannot read/edit members of room S002.
- Member can only read own original receipt images.
- Admin cannot retrieve original confirmed receipt image.
- Owner can read all rooms; no original images publicly accessible.
- First-login name/ID flow can only establish credentials once; subsequent access requires secure login.

## Statements
- Bank entries from BBL, BAY, SCB, GSB, KBANK import using tested formats.
- No two slips match the same bank entry.
- 7-Eleven batch or delayed settlement goes to manual review, not automatic missing-money claim.
- Editing amount/reference on matched slip clears bank-verified status until re-reconciled.

## Printing
- Member selecting 1, 2, 3, 5 slips yields 1, 1, 2, 3 portrait A4 sheets respectively.
- Exactly two original slip images per page maximum, with amount, time, reference, rights, payer and on-behalf-of information.
- Admin has no print UI.
- Owner can print one room or all rooms, filtered by month.

## Financial display
- Separate 300 THB program contribution from 50 THB admin expense per 350 THB right from 2026-10-11.
- Distinguish payer's own rights, paid on behalf of named member, and room support.
- Claimed outcomes are labeled as claims, never as guaranteed or received funds.
- Historical program selection uses original dates; ambiguous fallback is flagged.
