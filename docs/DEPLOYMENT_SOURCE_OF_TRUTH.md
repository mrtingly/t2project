# T2PROJECT V3 — deployment source of truth

This repository is the canonical location for all future frontend and backend edits.

## Current deployed pilot
- Apps Script project: https://script.google.com/home/projects/1X2Vs4uUa8GxaX4f9TSuav4VFIHEsUo4cPuG-MNLaxKGxU1CxDY4bsKRk/edit
- Web app: https://script.google.com/macros/s/AKfycbwNAeSKbQy53LG2ZRzp1q-AvHjv27VZSdFCQOqPtNPc2tFEaDUVciipEfy2E67RU-WlRQ/exec
- Database: Google Sheets ID `1T9n8bctitolSYtJXxkeU7_SSkO_R0H4YKlKSmOULeiQ` (14 tables)

## Important
Do not delete, reset, or replace the live Apps Script or Sheets project. A GitHub commit does not deploy automatically. First reconcile the exact deployed `Code.gs` and `index.html` with this repository, then test in a separate Apps Script deployment before updating production.

## Architecture
- GitHub: version-controlled frontend and backend source.
- Apps Script: authenticated server-side logic and HTML Service pilot hosting.
- Sheets: structured records; Drive: restricted original documents.
- GitHub Pages can later host the public frontend **only after** designing an authenticated cross-origin API; do not expose credentials or personal data in client code.

## Access policy
- Owner: all 8 rooms.
- Admin: S001–S008, room-scoped (A+, A, B, C, D, E, F, G).
- Member: only own records.
- Test credentials must never be committed to this repository. Shared passwords are unsafe; replace them before real use.

## Current status
Pilot opens a login screen, but complete production login, KYC recovery, receipt uploads, OCR, bank reconciliation and printing have not been independently verified. Do not claim production readiness.
