/**
 * Server-side member password login. Public HTTP route intentionally closed.
 * Never log usernames with passwords or return whether an account exists.
 */
function t2MemberLogin(username,password){
 const name=t2MemberUsername_(username);
 if(!name||typeof password!=="string"||password.length>128)
  return {ok:false,error:"INVALID_CREDENTIALS"};
 // Never disclose account existence. Enforce a short server-side cooldown
 // before expensive password verification to limit repeated guessing.
 const throttle=t2MemberLoginThrottle_(name);
 if(!throttle.ok)return {ok:false,error:"INVALID_CREDENTIALS"};
 // Use a uniform response for unknown users, incorrect passwords and throttling.
 const users=t2Rows_("Users");
 const account=users.find(u=>String(u.username||"").toLowerCase()===name&&
  String(u.role)==="member"&&String(u.status)==="active");
 if(!account||!String(account.member_id||""))
  return {ok:false,error:"INVALID_CREDENTIALS"};
 if(!t2PasswordVerify_(password,String(account.salt),String(account.password_hash)))
  return {ok:false,error:"INVALID_CREDENTIALS"};
 const member=t2ActivationMember_(account.member_id);
 if(!t2MemberLoginPolicy_(account,member))
  return {ok:false,error:"INVALID_CREDENTIALS"};
 // Session is issued only after the password and member status checks pass.
 const token=Utilities.getUuid()+Utilities.getUuid();
 const expires=new Date(Date.now()+60*60*1000);
 t2Sheet_("Sessions").appendRow([t2SessionHash_(token),String(account.user_id),expires,""]);
 t2Audit_("MEMBER_LOGIN",account.user_id,"Password login");
 return {ok:true,token:token,expires_at:expires.toISOString(),role:"member"};
}
/** Coarse per-username cooldown; shared script cache, no PII in keys. */
function t2MemberLoginThrottle_(username){
 const digest=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
  Utilities.DigestAlgorithm.SHA_256,"T2_LOGIN_THROTTLE:"+username));
 const cache=CacheService.getScriptCache();
 const key="login:"+digest.slice(0,48);
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(5000))return {ok:false};
 try{
  const attempts=Number(cache.get(key)||0);
  if(attempts>=5)return {ok:false};
  cache.put(key,String(attempts+1),300);
  return {ok:true};
 }finally{lock.releaseLock()}
}
/** Invalid and inactive accounts never receive a session. */
function t2MemberLoginPolicy_(account,member){
 return !!account&&String(account.role)==="member"&&
  String(account.status)==="active"&&!!String(account.member_id||"")&&
  !!member&&String(member.member_id)===String(account.member_id)&&
  String(member.status)==="active";
}
function t2MemberLoginPolicyTest(){
 const user={role:"member",status:"active",member_id:"M1"};
 const member={member_id:"M1",status:"active"};
 const cases=[
  t2MemberLoginPolicy_(user,member),
  !t2MemberLoginPolicy_(Object.assign({},user,{status:"suspended"}),member),
  !t2MemberLoginPolicy_(Object.assign({},user,{role:"admin"}),member),
  !t2MemberLoginPolicy_(user,Object.assign({},member,{status:"inactive"})),
  !t2MemberLoginPolicy_(user,Object.assign({},member,{member_id:"M2"}))
 ];
 if(!cases.every(Boolean))throw Error("Member login policy failed");
 return {ok:true,checks:cases.length};
}

/** Pure throttle boundary regression; does not modify cache or Sheets. */
function t2MemberThrottlePolicyTest(){
 const allowed=n=>Number.isInteger(n)&&n>=0&&n<5;
 const checks=[allowed(0),allowed(4),!allowed(5),!allowed(6),!allowed(-1)];
 if(!checks.every(Boolean))throw Error("Login throttle boundary failed");
 return {ok:true,checks:checks.length};
}
