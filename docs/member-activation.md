# T2PROJECT — Member account activation

## User-approved sequence

1. An administrator enters the member's full name and national ID into the private Members table.
2. For first access, the member supplies the matching full name and national ID to locate the existing profile.
3. The administrator independently verifies the person and approves account activation.
4. The member sets a unique Username and Password, linked to the original member_id.
5. Once the account is claimed, full name and national ID can never be used to sign in again.
6. All later logins use Username and Password.

## Access controls

- Admin can approve only members assigned to their room; Owner can approve across rooms.
- A name and national ID match is not proof of identity and must not reveal a profile by itself.
- Activation must be atomic and one-time. A claimed account cannot be reset to unclaimed.
- Password recovery requires independent identity verification and separate admin approval.
- Never store plaintext passwords. Do not enable the existing iterative SHA-256 helper for production password storage.
- OTP remains disabled.
- Public private-data routes and login remain disabled until reviewed and tested.

## Implementation

MemberActivation.gs contains pure policy checks and state-transition tests. Actual approval persistence, password hashing, session issuance and public login are not implemented.
