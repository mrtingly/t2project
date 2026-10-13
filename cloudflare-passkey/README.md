# T2PROJECT Passkey isolated prototype

The prototype source is packaged separately for Cloudflare Workers using @simplewebauthn/server, Cloudflare D1 and Wrangler. It is NOT wired into member login or GAS sessions. Do not deploy by pasting src/index.js into the browser editor: dependencies require bundling.

Existing password login and GAS V5 must remain unchanged until server-to-server session integration and WebAuthn verification have been tested.
