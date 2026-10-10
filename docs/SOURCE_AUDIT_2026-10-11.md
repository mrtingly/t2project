# T2PROJECT V3 — Source audit (2026-10-11)

## Evidence inspected
- Public GitHub `README.md`, `backend/Access.gs`, `backend/Enrollment.gs`, `backend/Recovery.gs`, `frontend/index.html`.
- Locally available archive `T2PROJECT_V3_GitHub_Source.zip`: `apps-script/Code.gs` (47 minified lines), `apps-script/Index.html` (9 minified lines), `apps-script/appsscript.json`.
- **Archive is not proven identical to the active Apps Script deployment.** The deployed source cannot be fetched by the GitHub connector.

## Confirmed source facts
| Area | Finding | Release decision |
| --- | --- | --- |
| Existing database | Archive references an existing spreadsheet ID and installation function; do not reinitialize production | Preserve and back up |
| Login | `login`, `logout`, `t2session_`, `t2newSession_` exist in archive | Test actual deployed source, rate limits and session revocation |
| Member first entry | `firstEntry` matches name and national ID token then issues setup token for PENDING_SETUP | **Block production onboarding** until independent verification is added |
| Recovery | `approveRecovery`, `recoveryEntry`, `setCredentials` exist | Test KYC, expiry, one-time use and invalidation |
| Roles | `t2owner_`, `t2admin_`, `t2member_` exist | Test every endpoint and cross-room isolation |
| Receipt capture | No upload function in inspected archive | Not implemented in inspected source |
| OCR | No OCR workflow in inspected archive | Not implemented in inspected source |
| Statement import/reconciliation | No import/reconcile functions in inspected archive | Not implemented in inspected source |
| Program confidentiality | Public docs omit numeric promotion details | Keep calculations, amounts and terms server-side, never in public source |
| HTML naming | Archive `doGet` references `Index`, archive has `Index.html`; previous live pilot was repaired to reference `index` | **Do not overwrite live deployment with archive** |
| Manifest | Archive manifest has webapp access `MYSELF` | Staging-only; not a public member deployment |
| Password hashing | Archive uses a custom repeated SHA-256 construction | Security review required; replace with vetted password KDF before production |
| Frontend divergence | GitHub `frontend/index.html` is different from archive `Index.html` | Choose canonical source only after verifying active live code |

## Immediate safe implementation sequence
1. **Do not deploy** the archive or run `initializeV3` / `installT2V3` on live data.
2. Retrieve the **current** Apps Script `Code.gs`, `index.html`, manifest via authenticated source access; compare with archive.
3. Check backup, access grants and Script Properties without exposing secrets.
4. Create private staging environment; implement independent first-entry verification and hardened credential/session handling.
5. Implement role isolation and tests; then member profile, receipt processing, reconciliation, reporting, printing and accessibility.
6. Deploy only after synthetic-data acceptance tests; maintain rollback path.

## GitHub scope
A GitHub commit is not an Apps Script deployment. No Apps Script source is committed from the archive because it embeds a production spreadsheet identifier and is not proven current or safe to publish.
