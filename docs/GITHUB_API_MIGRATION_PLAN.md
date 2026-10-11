# T2PROJECT — No-billing migration gate

**Decision 2026-10-11:** No Google Cloud Run, no new paid hosting, no banking API, no OCR. Preserve existing Sheets, Drive, Apps Script, GitHub and Owner data.

## Verified existing code
- `index.html` and `apps-script/index.html` contain 7 occurrences of `google.script.run`.
- The Apps Script backend `apps-script/Code.gs` exposes functions to HtmlService but no conventional HTTP `doPost` API.
- Existing Github Pages HTML cannot call `google.script.run` directly.
- GitHub Pages is public static hosting, not an authenticated backend.

## Critical security gate
Do **not** replace `google.script.run` with a simple cross-origin `fetch` to Apps Script and assume it will work: Apps Script does not provide the normal configurable CORS/preflight response surface expected by credentialed JSON APIs. Do **not** work around this by sending passwords, national IDs, or session tokens in GET URLs, JSONP, query parameters, hidden public sheets, or client-side secrets. CORS is not authentication.

## Feasible no-new-billing options, not yet selected
A. **Apps Script HtmlService app with access set to Anyone**: same existing backend and Google Sheets/Drive; frontend hosted by Apps Script, not GitHub Pages. Requires careful security review and test with non-Google browser session. This does not satisfy GitHub-as-primary-host requirement.

B. **GitHub Pages as public landing/static shell; authenticated app on Apps Script**: GitHub is the entry URL but protected workflow navigates to Apps Script-hosted app. This can avoid a separate API and billing, but authenticated app is not served entirely from GitHub. Requires confirmation of Apps Script deployment access and test of sign-in.

C. **GitHub Pages + external API service**: keeps all app pages on GitHub, but needs a compatible HTTPS backend with secure auth/CORS and Sheets/Drive access. A reliable secure *free* service cannot be assumed without checking limits, privacy and availability. Do not proceed without explicit selection and review.

## Next acceptance gate
Choose A, B, or C based on requirements. Until then, do not deploy auth/financial endpoints or claim GitHub Pages login is functional. Do not change `main` or live data.

## Changes in this development branch
- Removed the experimental `api/` Cloud Run scaffold to honor the no-billing decision.
- Kept the existing GitHub Pages frontend and Apps Script backend unchanged.
- Maintained backup branch `backup-before-github-api-migration-20261011`.

## Manual receipt policy
Admin enters and verifies each slip manually with the bank app; Sheets stores slip metadata and Drive stores the slip image. No OCR or bank API is needed.
