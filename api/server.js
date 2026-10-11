import express from "express";
import { pathToFileURL } from "node:url";

// Development scaffold only: no production login, member or financial endpoints.
// Do NOT attach live Sheets/Drive credentials until authorization is reviewed.
export function createApp({ allowedOrigin = process.env.ALLOWED_ORIGIN || "https://mrtingly.github.io" } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.headers.origin) {
      if (req.headers.origin !== allowedOrigin) return res.status(403).json({ ok: false, error: "Origin not allowed" });
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });
  app.get("/health", (_req, res) => res.json({ ok: true, service: "t2project-api", mode: "scaffold" }));
  app.use("/api", (_req, res) => res.status(501).json({ ok: false, error: "API not implemented; production data unavailable" }));
  app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8080);
  createApp().listen(port, "0.0.0.0", () => console.log("T2 API scaffold listening on", port));
}
