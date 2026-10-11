# T2PROJECT — GitHub Pages/API migration plan (development only)

Status: DESIGN ONLY. No production API or deployment changes have been made.

## Existing state (verified 2026-10-11)
- GitHub Pages frontend: `index.html`, with mirror `apps-script/index.html`.
- Apps Script backend: `apps-script/Code.gs`; `doGet()` serves the Apps Script HTML.
- The frontend still calls `google.script.run` (7 occurrences), which only works in Apps Script-served HTML.
- The backend has `login(payload)`, `dashboard(token)`, `logout(token)`, and member/receipt functions; it has **no `doPost` HTTP API**.
- Data is in private Google Sheets and Google Drive. Preserve all existing rows, files, users and properties.
- Owner bootstrap was completed. Do not run bootstrap again.

## Architecture decision
GitHub Pages remains a **static, public frontend only**. It cannot safely store service credentials, Apps Script secrets, password hashes, or act as an authenticated server.

Use a separately hosted HTTPS API gateway/backend that:
1. explicitly allows CORS only from the production GitHub Pages origin (and a separately configured development origin), with proper preflight OPTIONS support;
2. authenticates each request server-side, authorizes role and room/member scope on **every** operation, and rejects requests by default;
3. handles sessions with secure HttpOnly, Secure, SameSite cookies (subject to browser cross-site-cookie constraints), or a reviewed token design that never places tokens in URLs; protects against CSRF where cookies are used;
4. rate-limits login by account **and** source, provides audit logging, size limits, validation, and safe error messages;
5. accesses Google Sheets/Drive using server-held Google credentials and least privilege; never publishes the database or slip folder;
6. returns only data permitted to the caller; never returns national IDs or slip images to unrelated users.

**Hosting choice is NOT YET finalized.** Candidates include a Google Cloud Run/Functions service using a service account with scoped Sheets/Drive access, or another reviewed API host. Hosting/permissions and any associated cost require owner approval. Apps Script may remain for internal administrative operations; it should not be exposed as an unauthenticated JSONP or GET-with-password proxy.

## Why not direct browser -> Apps Script?
- `google.script.run` is available only in Apps Script HTML Service, not GitHub Pages.
- Apps Script web apps do not provide a conventional configurable CORS + OPTIONS preflight implementation for a robust browser API.
- Avoid JSONP, public anonymous `doGet` write operations, embedding API keys in the frontend, or sending credentials/session tokens via query strings.
- Changing the Apps Script deployment to “Anyone” would permit opening the page, but is not a complete security solution.

## Migration stages and acceptance gates
- [x] Create immutable recovery point: `backup-before-github-api-migration-20261011`.
- [x] Create isolated work branch: `feature/github-api-architecture-20261011`.
- [x] Document architecture and constraints (this file).
- [ ] Decide API host, identity/auth strategy, costs and secret management; obtain approval before provisioning.
- [ ] Build API contract and isolated test backend with mock users/data.
- [ ] Add browser API adapter; replace `google.script.run` usage in development branch only.
- [ ] Integrate least-privilege Google Sheets/Drive access in a separate test dataset.
- [ ] Verify Owner/Admin/Member authorization, IDOR prevention, logout/expiry, CSRF/CORS, receipt duplicate checks and uploads.
- [ ] Independent security review and privacy checks before real personal/financial data.
- [ ] Deploy reviewed frontend to GitHub Pages and migrate in a controlled manner.

## Safety and rollback
- Do not modify `main` until tests and approval.
- Do not delete/overwrite any Sheets tabs, Drive files, existing Owner or live sessions.
- Do not put Script Properties, credentials, national IDs, or real receipts in GitHub.
- Roll back the frontend to the saved branch/commit if necessary. Backend/data rollback must be planned separately.
