/**
 * T2PROJECT — no-subscription email sign-in foundation.
 * This module is deliberately NOT routed from public doPost.
 * Uses existing Google Apps Script MailApp quotas; no third-party paid service.
 * Account usernames must be verified email addresses before enabling.
 * Owner/admin only in this phase. Member sign-in requires a separate plan.
 *
 * SECURITY: This is a development implementation, NOT production-ready.
 * Before enabling public routes, add durable rate limits, delivery monitoring,
 * browser origin controls, abuse protection and a full security review.
 */
const T2_EMAIL_AUTH_ = Object.freeze({
  ttlSeconds: 300,
  cooldownSeconds: 90,
  maxAttempts: 5
});
function t2EmailAuthDigest_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value))
  );
}
function t2EmailAuthChallengeKey_(email) {
  return "t2:email:challenge:" + t2EmailAuthDigest_(email.toLowerCase());
}
function t2EmailAuthCooldownKey_(email) {
  return "t2:email:cooldown:" + t2EmailAuthDigest_(email.toLowerCase());
}
function t2EmailAuthRequest_(email) {
  const address = String(email || "").trim().toLowerCase();
  const generic = {ok:true,message:"หากบัญชีได้รับอนุญาต ระบบจะส่งรหัสยืนยันไปยังอีเมล"};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    return generic;
  }
  const cache = CacheService.getScriptCache();
  if (cache.get(t2EmailAuthCooldownKey_(address))) return generic;
  // No public disclosure of whether an email exists in the Users table.
  const users = t2Rows_("Users");
  const user = users.find(u =>
    String(u.username || "").trim().toLowerCase() === address &&
    String(u.status) === "active" &&
    (String(u.role) === "owner" || String(u.role) === "admin")
  );
  if (!user) return generic;
  const code = String(Math.floor(Math.random() * 1000000)).padStart(6,"0");
  const nonce = Utilities.getUuid();
  const digest = t2EmailAuthDigest_(nonce + ":" + code);
  const key = t2EmailAuthChallengeKey_(address);
  cache.put(key,JSON.stringify({nonce:nonce,digest:digest,attempts:0,user_id:String(user.user_id)}),T2_EMAIL_AUTH_.ttlSeconds);
  cache.put(t2EmailAuthCooldownKey_(address),"1",T2_EMAIL_AUTH_.cooldownSeconds);
  try {
    MailApp.sendEmail({
      to:address,
      subject:"T2PROJECT รหัสยืนยันการเข้าสู่ระบบ",
      body:"รหัสยืนยันของคุณคือ " + code + "\nรหัสหมดอายุภายใน 5 นาที\nหากไม่ได้ร้องขอ กรุณาเพิกเฉย"
    });
  } catch (_) {
    cache.remove(key);
    return {ok:false,error:"DELIVERY_UNAVAILABLE"};
  }
  return generic;
}
function t2EmailAuthConfirm_(email,code) {
  const address = String(email || "").trim().toLowerCase();
  const input = String(code || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || !/^\d{6}$/.test(input))
    return {ok:false,error:"INVALID_CODE"};
  const cache = CacheService.getScriptCache();
  const key = t2EmailAuthChallengeKey_(address);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {ok:false,error:"BUSY"};
  try {
    const raw = cache.get(key);
    if (!raw) return {ok:false,error:"INVALID_OR_EXPIRED_CODE"};
    const challenge = JSON.parse(raw);
    if (challenge.attempts >= T2_EMAIL_AUTH_.maxAttempts) {
      cache.remove(key);
      return {ok:false,error:"INVALID_OR_EXPIRED_CODE"};
    }
    challenge.attempts++;
    if (t2EmailAuthDigest_(challenge.nonce + ":" + input) !== challenge.digest) {
      if (challenge.attempts >= T2_EMAIL_AUTH_.maxAttempts) cache.remove(key);
      else cache.put(key,JSON.stringify(challenge),T2_EMAIL_AUTH_.ttlSeconds);
      return {ok:false,error:"INVALID_OR_EXPIRED_CODE"};
    }
    cache.remove(key);
    const user = t2Rows_("Users").find(u =>
      String(u.user_id) === challenge.user_id &&
      String(u.username || "").trim().toLowerCase() === address &&
      String(u.status) === "active" &&
      ["owner","admin"].includes(String(u.role))
    );
    if (!user) return {ok:false,error:"UNAUTHORIZED"};
    const token = Utilities.getUuid() + Utilities.getUuid();
    const expires = new Date(Date.now() + 30*60*1000);
    t2Sheet_("Sessions").appendRow([t2SessionHash_(token),user.user_id,expires,""]);
    t2Audit_("EMAIL_SIGN_IN",user.user_id,String(user.role));
    return {ok:true,token:token,role:String(user.role),expires_at:expires.toISOString()};
  } finally {
    lock.releaseLock();
  }
}
