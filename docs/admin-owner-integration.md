# T2PROJECT — Admin / Owner workflow integration

Status: development specification. No live authentication or personal-data API is enabled.

## Admin
1. Authenticate with a reviewed identity provider before loading any member data.
2. Search members by name, with results restricted to the administrator's assigned room.
3. Create a member only after checking duplicates across the entire database.
4. Select a member and enter receipt details. Show the image alongside the form once secure upload is available.
5. Display the saved receipt as pending verification; never treat it as bank-confirmed.
6. Show receipt history and totals limited to the administrator's room.

## Owner
1. View all rooms and their member/receipt summaries.
2. View pending bank-reconciliation items.
3. Match receipts manually against bank statements before approval.
4. Keep an immutable audit record of who approved each receipt and the evidence reference.
5. Provide printable reports by date range, room, member and administrator.

## Required integration gates
- Identity provider and backend authorization must be reviewed before opening private endpoints.
- Browser must never receive service-account credentials, password hashes or privileged keys.
- Receipt images must remain private; authorization must be enforced on every retrieval.
- Reject duplicate submissions atomically and handle partial upload failures.
- Confirm backup and rollback procedures before deployment.
- Do not modify legacy data or historical backups.

## Current implementation boundary
The development branch contains member creation, receipt metadata creation, room-scoped listings and summaries, and a read-only reconciliation queue. The admin workflow HTML is a non-operational preview. None of these private operations is currently exposed through the public Apps Script API. Real login and secure receipt-image upload are outstanding.
