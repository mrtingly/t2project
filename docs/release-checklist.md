# T2PROJECT V2 — deployment and security release checklist

This checklist separates work committed to the development branch from a production-ready deployment.

## Architecture
- Frontend: GitHub Pages; no sensitive member records embedded in HTML or JavaScript.
- Backend: Apps Script as a server-side API; database in private Google Sheets.
- Private files: Google Drive, accessible only after server-side authorization.
- Public endpoints: health and fixed transport probe only until the reviewed authentication design is implemented.

## Development implemented
- Manual member registration with room-scoped authorization and duplicate checks.
- Manual receipt metadata creation and duplicate checks; new receipts are pending verification.
- Member receipt history, member totals, and printable data snapshot.
- Owner room totals and pending-reconciliation read-only queue.
- Scoped receipt reports for owner and admins.
- Static responsive previews for Admin, Member and Owner.

## Blocking items before public launch
1. Select and configure a managed identity provider. Do not enable the legacy password hash scheme.
2. Verify provider-issued tokens server-side, including signature, audience, issuer, expiry and revocation policy.
3. Authorize every private action against current Users/Rooms/Members records, not client-supplied roles.
4. Add authenticated POST endpoints with strict payload validation and replay/abuse protections.
5. Add private slip-image upload and retrieval, file type/size restrictions, and partial-failure cleanup.
6. Add an owner-only, evidence-backed bank statement approval workflow with auditability.
7. Build fully interactive screens and perform end-to-end tests with synthetic data in a test environment.
8. Review data retention, privacy notice, backup/restore, rollback, and deployment permissions.
9. Obtain owner approval before production deployment.

## Required owner action when implementation reaches the identity-provider gate
Choose or authorize an identity provider and its project configuration. This requires access to the user's external account and cannot be completed by committing frontend code alone.

## Never do
- Do not turn on T2_AUTH_API_ENABLED or legacy login as a shortcut.
- Do not place personal data or private credentials in GitHub.
- Do not use the historical database or backup as test data.
- Do not represent unverified receipts as bank-confirmed investments.
