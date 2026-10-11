# T2PROJECT Cloud Run API — safe development scaffold

This is a **non-production scaffold**, not a usable authentication service. It deliberately exposes only `GET /health` and returns 501 for `/api/*`. It does not read any Google Sheet, Drive folder, or account credentials.

## Local test
Requires Node.js 22+:
```sh
cd api
npm install
npm test
npm start
```

## Deployment prerequisites (not yet performed)
1. Owner selects and controls a Google Cloud project with billing and budget alerts.
2. Provision Cloud Run with least-privilege service identity; do not deploy publicly with member data yet.
3. Decide auth/session architecture and implement server-side role/room/member checks.
4. Use a **separate test** Google Spreadsheet and Drive folder, with narrowly scoped access.
5. Security review before any real credentials, national IDs, slips or public deployment.

The `ALLOWED_ORIGIN` environment variable defaults to `https://mrtingly.github.io`. This is a browser CORS allowlist, **not** authentication or authorization. Requests without an Origin header (such as curl) can still access public endpoints; never rely on CORS to protect data.

Do not add API keys, service-account JSON, or other secrets to GitHub.
