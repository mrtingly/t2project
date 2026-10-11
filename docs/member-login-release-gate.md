# Member login release gate

Current status: **NOT production ready**. The public Apps Script POST endpoint remains closed.

## Implemented in this branch
- Admin approval and room-scoped activation queues.
- Fifteen-minute single-use invitation issued only after approval.
- Username validation and duplicate account checks.
- Versioned PBKDF2-HMAC-SHA256 credential hashing.
- Server-side atomic-lock member claim with account bound to member_id.

## Mandatory checks before enabling login
1. Deploy new .gs files to the bound Apps Script project; GitHub commits do not deploy them.
2. Run additive t2InstallMemberActivation() and t2InstallActivationTickets() from Apps Script editor.
3. Run t2PasswordKdfTest(), t2InvitePolicyTest(), t2MemberAccountPolicyTest() and the activation regression suite; inspect any failures.
4. Benchmark t2PasswordCreate_ and t2PasswordVerify_ on Apps Script quotas and set an independently reviewed work factor.
5. Add public transport with abuse controls, per-username/IP-equivalent throttling, uniform error responses and CSRF/origin threat analysis.
6. Implement credential login, session issuance/rotation and logout; currently not connected to public doPost.
7. Test interrupted claim writes, retries, duplicate usernames, stolen/expired tickets, authorization boundaries and recovery.
8. Complete privacy review for Thai national IDs and restrict spreadsheet/Drive permissions.
9. End-to-end test with synthetic records, then deploy and verify from GitHub Pages.

## Important failure mode
Google Sheets does not provide multi-row database transactions. MemberClaim.gs consumes the invitation before appending a user, so a partial write can require authorized operator reconciliation. Do not enable the public claim route until this is resolved.

Never use full name plus national ID as an ongoing login credential. No OTP is required by the approved design.
