import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./server.js";

async function serve(fn) {
  const server = createApp().listen(0, "127.0.0.1");
  try { return await fn("http://127.0.0.1:" + server.address().port); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
test("health and CORS allow configured origin", async () => serve(async url => {
  const r = await fetch(url + "/health", { headers: { Origin: "https://mrtingly.github.io" } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), "https://mrtingly.github.io");
  assert.equal((await r.json()).mode, "scaffold");
}));
test("reject unapproved origin", async () => serve(async url => {
  const r = await fetch(url + "/health", { headers: { Origin: "https://untrusted.example" } });
  assert.equal(r.status, 403);
}));
test("no live API exposed", async () => serve(async url => {
  const r = await fetch(url + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(r.status, 501);
}));
