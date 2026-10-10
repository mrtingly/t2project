# GitHub / Apps Script synchronization status

The active Apps Script pilot uses two files: `Code.gs` and `Index.html`. The matching source snapshot exists in a downloadable archive in the working conversation, but **the exact two files have not been committed to this repository yet**. Do not mistake `frontend/index.html` for the deployed HTML; it is a separately developed client.

The Google Apps Script project is not automatically connected to GitHub. A GitHub commit does not deploy it. Do not delete the existing working web app or spreadsheet.

## Safe sync procedure
1. Commit the exact matching `Code.gs` and `Index.html` under `apps-script/` (ensure the `Index` filename matches `doGet`).
2. Keep `appsscript.json` and `Code.gs` in the same Apps Script source directory.
3. Review the source for embedded credentials and personal data before pushing to a public repository.
4. Use a separate staging Apps Script deployment and test access restrictions.
5. Only after tests pass, update the active deployment.

## Unfinished functions
Receipt upload/OCR, statement reconciliation, full reporting/printing, and production authentication security are not complete. Shared test passwords must be replaced before real use.

## Important
The `backend/Schema.gs` initialization script is for an empty spreadsheet; **do not run it** on the existing 14-table database.
