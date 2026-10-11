/* T2PROJECT API transport adapter (development branch only).
 * No credentials, tokens or personal information are persisted or logged.
 * Auth routes remain disabled on the deployed Apps Script backend.
 */
(function (root) {
  "use strict";
  const PROBE = "T2_PUBLIC_PROBE_V1";
  function endpoint() {
    const url = root.T2_APP_URL;
    if (typeof url !== "string" || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
      throw new Error("T2 API endpoint is not configured");
    }
    return url;
  }
  async function parseResponse(response) {
    if (!response.ok) throw new Error("API HTTP " + response.status);
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid API response");
    return data;
  }
  async function health() {
    const url = endpoint() + "?action=health";
    const response = await fetch(url, { method: "GET", credentials: "omit", cache: "no-store", redirect: "follow" });
    return parseResponse(response);
  }
  async function transportProbe() {
    const response = await fetch(endpoint() + "?action=transport_probe", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: PROBE,
      credentials: "omit",
      cache: "no-store",
      redirect: "follow"
    });
    return parseResponse(response);
  }
  // Deliberately refuses login data until the authentication protocol has been reviewed.
  function login() {
    return Promise.reject(new Error("Login API is not enabled"));
  }
  root.T2Api = Object.freeze({ health, transportProbe, login });
})(window);
