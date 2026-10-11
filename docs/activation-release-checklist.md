# T2PROJECT — Activation release checklist

The new member-activation preview and policy are development-only. Do not publish live enrollment or login routes until the following are complete.

- [x] One-time activation state model
- [x] Room-scoped administrator approval policy
- [x] Policy regression functions
- [x] Responsive, disabled preview
- [ ] Add an additive activation table in the private database
- [ ] Add admin review queue with independent identity verification
- [ ] Add durable, atomic one-time approval and claim operations
- [ ] Select and implement a vetted password hashing approach
- [ ] Add secure username/password login and account recovery
- [ ] Add server-side request throttling and audit logging
- [ ] Complete authorization and abuse testing with synthetic users
- [ ] Owner deploys reviewed Apps Script changes and authorizes Google scopes
- [ ] Owner approves production launch

Important: the first-time name + national ID lookup cannot by itself establish ownership. The administrator must verify the applicant separately before permitting account claim. Never return profile data during an unverified lookup.
