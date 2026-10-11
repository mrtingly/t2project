# Member portal integration — development release gate

This branch contains a functional same-origin Apps Script member portal implementation, **not a production deployment**.

## Files to install together
- `apps-script/MemberPortalServer.gs`
- `apps-script/MemberPortal.html`
- Updated `apps-script/Code.gs` (merge carefully with existing GAS Code.gs; do not overwrite custom production changes)

Existing dependencies: MemberLogin.gs, PasswordKdf.gs, MemberActivation.gs, and core Code.gs authorization helpers.

## Deployment model
The portal is served by the Apps Script `doGet?action=member_portal` route, and communicates with server functions through `google.script.run`. The gate `T2_MEMBER_PORTAL_ENABLED` is **off unless explicitly set to `true`** in Script Properties. Do not enable for real users until all checks below pass.

## Release blockers
- Install the new files and run the consolidated self-test (including room-access and throttle checks).
- Benchmark 12,000-iteration password verification on actual Apps Script runtime.
- Test claim, login, profile isolation, logout, expiry, and disabled-member behavior with synthetic accounts.
- Test simultaneous login attempts, abuse controls, partial claim writes, and lock contention.
- Independently review deployment access, Apps Script execute-as permissions, session handling, and account recovery.
- Confirm owner/admin provisioning and their room permissions before enabling their workflows.
- Validate totals and status rules for slips against product requirements.

## Privacy
Member portal returns only name, room, phone, email, and aggregate slip count/amount for the authenticated member. No national ID, bank account, or Drive file IDs are returned. Never log tokens or credentials.

## Known limitations
The GitHub Pages login is still a disabled demo. Admin and Owner real dashboards are not integrated. The member portal has not been installed or end-to-end tested in the user's GAS environment. Do not merge to main or announce production readiness yet.
