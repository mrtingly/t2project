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
  maxAttempts: 5,
  maxCodeRequestsPerDay: 12
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
function t2EmailAuthRemainingSeconds_(issuedAt,now) {
  const elapsed = Math.max(0,Math.floor((now-issuedAt)/1000));
  return Math.max(0,T2_EMAIL_AUTH_.ttlSeconds-elapsed);
}
function t2EmailAuthRequest_(email) {
  const address = String(email || "").trim().toLowerCase();
  const generic = {ok:true,message:"หากบัญชีได้รับอนุญาต ระบบจะส่งรหัสยืนยันไปยังอีเมล"};
  // Account existence is not disclosed to the caller.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    return generic;
  }
  const cache = CacheService.getScriptCache();
  const requestLock = LockService.getScriptLock();
  if (!requestLock.tryLock(10000)) return generic;
  try {
  if (cache.get(t2EmailAuthCooldownKey_(address))) return generic;
  const dayKey="t2:email:daily:"+Utilities.formatDate(new Date(),"Asia/Bangkok","yyyyMMdd")+":"+t2EmailAuthDigest_(address);
  const daily=Number(cache.get(dayKey)||0);
  if(daily>=T2_EMAIL_AUTH_.maxCodeRequestsPerDay)return generic;
  // No public disclosure of whether an email exists in the Users table.
  const users = t2Rows_("Users");
  const user = users.find(u =>
    String(u.username || "").trim().toLowerCase() === address &&
    String(u.status) === "active" &&
    (String(u.role) === "owner" || String(u.role) === "admin")
  );
  if (!user) return generic;
  const randomHex = Utilities.getUuid().replace(/-/g,"").slice(0,12);
  const code = String(parseInt(randomHex,16) % 1000000).padStart(6,"0");
  const nonce = Utilities.getUuid();
  const digest = t2EmailAuthDigest_(nonce + ":" + code);
  const key = t2EmailAuthChallengeKey_(address);
  cache.put(key,JSON.stringify({nonce:nonce,digest:digest,attempts:0,user_id:String(user.user_id),issued_at:Date.now()}),T2_EMAIL_AUTH_.ttlSeconds);
  cache.put(dayKey,String(daily+1),86400);
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
  } finally { requestLock.releaseLock(); }
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
    const remaining=t2EmailAuthRemainingSeconds_(Number(challenge.issued_at),Date.now());
    if(!Number.isFinite(remaining)||remaining<=0){cache.remove(key);return {ok:false,error:"INVALID_OR_EXPIRED_CODE"}}
    if (challenge.attempts >= T2_EMAIL_AUTH_.maxAttempts) {
      cache.remove(key);
      return {ok:false,error:"INVALID_OR_EXPIRED_CODE"};
    }
    challenge.attempts++;
    if (t2EmailAuthDigest_(challenge.nonce + ":" + input) !== challenge.digest) {
      if (challenge.attempts >= T2_EMAIL_AUTH_.maxAttempts) cache.remove(key);
      else cache.put(key,JSON.stringify(challenge),remaining);
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

/** Pure security regression checks; no mail, Sheets, or real accounts. */
function t2EmailAuthPolicyTest(){
 const now=1700000000000;
 const checks=[
  ["fresh",t2EmailAuthRemainingSeconds_(now,now)===300],
  ["after_one_second",t2EmailAuthRemainingSeconds_(now,now+1000)===299],
  ["near_expiry",t2EmailAuthRemainingSeconds_(now,now+299000)===1],
  ["expired",t2EmailAuthRemainingSeconds_(now,now+300000)===0],
  ["long_expired",t2EmailAuthRemainingSeconds_(now,now+999000)===0]
 ];
 const result={ok:checks.every(x=>x[1]),results:checks.map(x=>({test:x[0],passed:x[1]}))};
 if(!result.ok)throw Error("Email OTP expiry policy failed");
 return result;
}
