# T2PROJECT — GitHub frontend / Apps Script backend

## Current verified state (2026-10-11)
- `index.html` is stored in GitHub; `apps-script/index.html` is its mirror.
- `apps-script/Code.gs` implements Apps Script server methods including `login`, `dashboard`, `t2FindMembers`, `t2SaveReceipt`.
- The current frontend calls `google.script.run`. **This only exists when the HTML is served by Apps Script HtmlService.** A GitHub Pages site cannot call it directly.
- Do not expose the spreadsheet ID, API keys, passwords, member national IDs, or session tokens in a public repository.
- **No production deployment or end-to-end test has been verified.**

## Safe immediate deployment (recommended)
1. Keep GitHub as the canonical **source-code repository** for the frontend.
2. Copy the exact content of `apps-script/index.html` into the Apps Script HTML file named `index`.
3. Copy `apps-script/Code.gs` into the Apps Script server project after reviewing existing project files and making a backup.
4. In Apps Script Script Properties, set `T2_DB_ID` and `T2_SLIP_FOLDER_ID` to private resources. Never commit these values.
5. Confirm the existing database schema, run the installer/preflight as appropriate, and deploy as a Web App with restricted access.
6. Test with synthetic data: Admin logs in, searches a member in their own room, manually submits a receipt with a small image, checks duplicate rejection, confirms a different room cannot be accessed, and verifies audit logs.
7. Before handling real financial/member data, independently review authentication, authorization, rate limiting, file retention, and access controls.

## If GitHub Pages must be the actual hosting origin
Do **not** paste a Web App `/exec` URL into `index.html` and assume `google.script.run` works. A cross-origin API transport, authorization model, and browser CORS handling must be designed and tested first. In particular, don't put shared secrets in client-side JavaScript and don't use a publicly writable Apps Script endpoint. Until such a backend gateway exists, the GitHub Pages site is a frontend prototype and the Apps Script-served URL is the functional web app.

## Receipt policy
Only an authenticated Admin can manually enter a receipt. The backend must check the Admin's room, select a member from Master, validate all fields, detect duplicates under a lock, save the image to a private Drive folder, and append an audit entry. Bank verification is a separate human step. No automatic OCR or automatic receipt creation.
