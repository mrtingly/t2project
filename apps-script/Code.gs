/**
 * T2PROJECT — fresh-start Apps Script server.
 * Backend API only. GitHub Pages owns all HTML/UI.
 * Never publish user data or credentials in GitHub.
 * T2_DB_ID must point to the existing approved private spreadsheet.
 *
 * Bootstrap: set T2_BOOTSTRAP_OWNER_USER and T2_BOOTSTRAP_OWNER_PASSWORD
 * in Script Properties temporarily, run t2Install() from Apps Script editor,
 * then verify both bootstrap properties were removed.
 * Do not use a real national ID as a login credential.
 */
const T2_={users:"Users",audit:"AuditLog",sessions:"Sessions"};
function t2Json_(value){
 return ContentService.createTextOutput(JSON.stringify(value))
  .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e){
 // Public diagnostics only. Never expose credentials, users, or database contents.
 const p=(e&&e.parameter)||{};
 if(p.t2_probe==="1" || p.action==="health"){
  return t2Json_({service:"t2project",probe:"ok",version:2,mode:"public-health-only"});
 }
 return t2Json_({ok:false,error:"UNSUPPORTED_PUBLIC_ENDPOINT"});
}
function doPost(e){
 // Only a public, fixed-shape connectivity probe is accepted.
 // Never log or echo POST bodies; never accept credentials until CORS and
 // the production authentication design have been independently verified.
 const p=(e&&e.parameter)||{};
 const body=e&&e.postData&&typeof e.postData.contents==="string"?e.postData.contents:"";
 if(p.action==="transport_probe"&&body==="T2_PUBLIC_PROBE_V1"&&
    e.postData.type==="text/plain"&&body.length===18){
  return t2Json_({service:"t2project",probe:"post-ok",version:2,mode:"public-transport-only"});
 }
 if(p.action==="auth_status"){
  // Public capability discovery: fixed response, no secrets or user data.
  // Does not depend on a caller-supplied flag or Script Properties.
  if(body===""&&e&&e.postData&&e.postData.type==="text/plain")
   return t2Json_({service:"t2project",version:2,authEnabled:false,loginEnabled:false,mode:"auth-closed"});
  return t2Json_({ok:false,error:"INVALID_REQUEST"});
 }
 return t2Json_({ok:false,error:"API_POST_NOT_ENABLED"});
}

/**
 * Strict JSON envelope validation for future authenticated POST requests.
 * Pure function: never writes to Sheets, logs credentials, or creates sessions.
 */
function t2ValidateAuthEnvelope_(raw){
 if(typeof raw!=="string"||raw.length>4096)return {ok:false,error:"INVALID_REQUEST"};
 let data;
 try{data=JSON.parse(raw)}catch(_){return {ok:false,error:"INVALID_JSON"}}
 if(!data||typeof data!=="object"||Array.isArray(data))return {ok:false,error:"INVALID_REQUEST"};
 const keys=Object.keys(data);
 if(keys.length!==2||!keys.includes("action")||!keys.includes("payload"))return {ok:false,error:"INVALID_REQUEST"};
 if(typeof data.action!=="string"||!["login","dashboard","logout"].includes(data.action))return {ok:false,error:"ACTION_NOT_AVAILABLE"};
 if(!data.payload||typeof data.payload!=="object"||Array.isArray(data.payload))return {ok:false,error:"INVALID_REQUEST"};
 const p=data.payload;
 if(data.action==="login"){
  if(Object.keys(p).sort().join("|")!=="password|role|username"||
   typeof p.username!=="string"||!/^[a-zA-Z0-9._@-]{4,80}$/.test(p.username)||
   typeof p.password!=="string"||!p.password||p.password.length>256||
   !["owner","admin","member"].includes(p.role))return {ok:false,error:"INVALID_REQUEST"};
 }else if(Object.keys(p).join("|")!=="token"||typeof p.token!=="string"||
          p.token.length<50||p.token.length>200)return {ok:false,error:"INVALID_REQUEST"};
 return {ok:true,action:data.action,payload:p};
}
/** Editor-only parser tests: all credentials and tokens are fictitious. */
function t2AuthEnvelopeTest(){
 const good=JSON.stringify({action:"login",payload:{username:"testowner",password:"dummy-password",role:"owner"}});
 const checks=[
  ["valid_login",t2ValidateAuthEnvelope_(good).ok===true],
  ["bad_json",t2ValidateAuthEnvelope_("{").error==="INVALID_JSON"],
  ["unknown_action",t2ValidateAuthEnvelope_(JSON.stringify({action:"erase",payload:{}})).error==="ACTION_NOT_AVAILABLE"],
  ["extra_fields",t2ValidateAuthEnvelope_(JSON.stringify({action:"login",payload:{username:"testowner",password:"x",role:"owner",admin:true}})).error==="INVALID_REQUEST"],
  ["bad_role",t2ValidateAuthEnvelope_(JSON.stringify({action:"login",payload:{username:"testowner",password:"x",role:"superuser"}})).error==="INVALID_REQUEST"],
  ["short_token",t2ValidateAuthEnvelope_(JSON.stringify({action:"dashboard",payload:{token:"x"}})).error==="INVALID_REQUEST"],
  ["large_body",t2ValidateAuthEnvelope_("x".repeat(4097)).error==="INVALID_REQUEST"]
 ];
 const result={ok:checks.every(c=>c[1]),results:checks.map(c=>({test:c[0],passed:c[1]}))};
 console.log(JSON.stringify(result));
 if(!result.ok)throw Error("Auth envelope test failed");
 return result;
}

/**
 * Authenticated POST request preparation, with server-side kill switch.
 * Parsing is only attempted when the private feature flag is enabled.
 * Public doPost remains probe-only until a separate deployment review.
 */
function t2PrepareAuthPost_(raw){
 if(PropertiesService.getScriptProperties().getProperty("T2_AUTH_API_ENABLED")!=="true")
  return {ok:false,error:"AUTH_API_DISABLED"};
 const parsed=t2ValidateAuthEnvelope_(raw);
 if(!parsed.ok)return {ok:false,error:parsed.error};
 // No login dispatch until password hashing and abuse controls are reviewed.
 if(parsed.action==="login")return {ok:false,error:"LOGIN_NOT_ENABLED"};
 return t2AuthApiDispatch_(parsed.action,parsed.payload);
}
/** Test the disabled public boundary without changing script properties. */
function t2AuthPostBoundaryTest(){
 const enabled=PropertiesService.getScriptProperties().getProperty("T2_AUTH_API_ENABLED")==="true";
 if(enabled)throw Error("Disable T2_AUTH_API_ENABLED before testing");
 const request=JSON.stringify({action:"login",payload:{username:"testowner",password:"dummy",role:"owner"}});
 const checks=[
  ["disabled_login",t2PrepareAuthPost_(request).error==="AUTH_API_DISABLED"],
  ["disabled_dashboard",t2PrepareAuthPost_(JSON.stringify({action:"dashboard",payload:{token:"x".repeat(64)}})).error==="AUTH_API_DISABLED"],
  ["disabled_bad_json",t2PrepareAuthPost_("{").error==="AUTH_API_DISABLED"],
  ["public_post_still_denied",JSON.parse(doPost({parameter:{action:"login"},postData:{contents:request,type:"text/plain"}}).getContent()).error==="API_POST_NOT_ENABLED"]
 ];
 const result={ok:checks.every(x=>x[1]),results:checks.map(x=>({test:x[0],passed:x[1]}))};
 console.log(JSON.stringify(result));
 if(!result.ok)throw Error("Auth POST boundary test failed");
 return result;
}

/**
 * Auth API router foundation. Deliberately disabled for all public requests.
 * The server ignores caller-provided flags: only Script Properties can enable it.
 * Do not enable until credential hashing, abuse controls, and deployment security
 * have received independent review.
 */
function t2AuthApiDispatch_(action,payload){
 if(PropertiesService.getScriptProperties().getProperty("T2_AUTH_API_ENABLED")!=="true")
  return {ok:false,error:"AUTH_API_DISABLED"};
 if(!payload||typeof payload!=="object"||Array.isArray(payload))
  return {ok:false,error:"INVALID_REQUEST"};
 if(action==="dashboard"){
  if(typeof payload.token!=="string"||payload.token.length<50||payload.token.length>200)
   return {ok:false,error:"UNAUTHORIZED"};
  try{return dashboard(payload.token)}catch(_){return {ok:false,error:"UNAUTHORIZED"}}
 }
 if(action==="logout"){
  if(typeof payload.token!=="string"||payload.token.length<50||payload.token.length>200)
   return {ok:false,error:"UNAUTHORIZED"};
  return logout(payload.token);
 }
 return {ok:false,error:"ACTION_NOT_AVAILABLE"};
}
/** Editor-only test. No database access, credentials, or sessions. */
function t2AuthApiGateTest(){
 const props=PropertiesService.getScriptProperties();
 if(props.getProperty("T2_AUTH_API_ENABLED")==="true")
  throw Error("Disable T2_AUTH_API_ENABLED before running gate test");
 const checks=[
  ["dashboard_blocked",t2AuthApiDispatch_("dashboard",{token:"x".repeat(64)}).error==="AUTH_API_DISABLED"],
  ["logout_blocked",t2AuthApiDispatch_("logout",{token:"x".repeat(64)}).error==="AUTH_API_DISABLED"],
  ["login_unavailable",t2AuthApiDispatch_("login",{username:"test"}).error==="AUTH_API_DISABLED"],
  ["public_post_blocked",JSON.parse(doPost({parameter:{action:"dashboard"},postData:{contents:"{}",type:"text/plain"}}).getContent()).error==="API_POST_NOT_ENABLED"]
 ];
 const report={ok:checks.every(c=>c[1]),results:checks.map(c=>({test:c[0],passed:c[1]}))};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Auth API gate test failed");
 return report;
}

/** Public auth status smoke test: safe for the Apps Script editor. */
function t2AuthStatusTest(){
 const result=JSON.parse(doPost({parameter:{action:"auth_status"},postData:{contents:"",type:"text/plain"}}).getContent());
 const blocked=JSON.parse(doPost({parameter:{action:"login"},postData:{contents:"{}",type:"text/plain"}}).getContent());
 const report={ok:result.authEnabled===false&&result.loginEnabled===false&&result.mode==="auth-closed"&&blocked.error==="API_POST_NOT_ENABLED",authStatus:result,loginBlocked:blocked.error==="API_POST_NOT_ENABLED"};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Auth status test failed");
 return report;
}

/**
 * Safe public API security smoke test. Run from the Apps Script editor.
 * Does not touch the database, create sessions, or accept credentials.
 */
function t2PublicApiSecurityTest(){
 const cases=[
  {name:"health",actual:JSON.parse(doGet({parameter:{action:"health"}}).getContent()),expect:"ok"},
  {name:"private_get_denied",actual:JSON.parse(doGet({parameter:{action:"dashboard",token:"fake"}}).getContent()),expect:"UNSUPPORTED_PUBLIC_ENDPOINT"},
  {name:"login_post_denied",actual:JSON.parse(doPost({parameter:{action:"login"},postData:{contents:'{"username":"test","password":"test"}',type:"text/plain"}}).getContent()),expect:"API_POST_NOT_ENABLED"},
  {name:"unknown_post_denied",actual:JSON.parse(doPost({parameter:{action:"unknown"},postData:{contents:"",type:"text/plain"}}).getContent()),expect:"API_POST_NOT_ENABLED"},
  {name:"probe_post_allowed",actual:JSON.parse(doPost({parameter:{action:"transport_probe"},postData:{contents:"T2_PUBLIC_PROBE_V1",type:"text/plain"}}).getContent()),expect:"post-ok"}
 ];
 const results=cases.map(c=>({test:c.name,passed:c.actual.probe===c.expect||c.actual.error===c.expect}));
 const report={ok:results.every(x=>x.passed),results};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Public API security smoke test failed");
 return report;
}
function t2Db_(){
 const id=PropertiesService.getScriptProperties().getProperty("T2_DB_ID");
 if(!id)throw Error("Database is not configured");
 return SpreadsheetApp.openById(id);
}
function t2Sheet_(name){const sh=t2Db_().getSheetByName(name);if(!sh)throw Error("Missing table: "+name);return sh}
function t2Rows_(name){const values=t2Sheet_(name).getDataRange().getValues();return values.slice(1).map(row=>Object.fromEntries(values[0].map((key,i)=>[key,row[i]])))}
function t2Hash_(password,salt){
 // Iterated SHA-256 is not a password KDF. Production launch requires an
 // independently reviewed authentication provider or a vetted KDF service.
 let v=salt+":"+password;
 for(let i=0;i<15000;i++)v=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v));
 return v;
}
// Fast SHA-256 for random, high-entropy session tokens only; NOT for passwords.
function t2SessionHash_(token){
 return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,"T2_SESSION_V2:"+token));
}
function t2Audit_(action,actor,detail){t2Sheet_(T2_.audit).appendRow([new Date(),action,actor,String(detail||"").slice(0,300)])}
function t2Install(){
 const props=PropertiesService.getScriptProperties();
 const db=t2Db_();
 const specs={Users:["user_id","username","role","room_id","member_id","salt","password_hash","status","created_at"],
 AuditLog:["at","action","actor","detail"],
 Sessions:["token_hash","user_id","expires_at","revoked_at"]};
 for(const [name,headers] of Object.entries(specs)){
  let sh=db.getSheetByName(name);
  if(!sh){sh=db.insertSheet(name);sh.appendRow(headers)}
  else if(sh.getLastRow()>0&&sh.getRange(1,1,1,headers.length).getValues()[0].join("|")!==headers.join("|"))throw Error("Existing table has incompatible schema: "+name);
  else if(sh.getLastRow()===0)sh.appendRow(headers);
 }
 const user=String(props.getProperty("T2_BOOTSTRAP_OWNER_USER")||"").trim();
 const pass=props.getProperty("T2_BOOTSTRAP_OWNER_PASSWORD")||"";
 if(user||pass){
  if(user.length<4||pass.length<12)throw Error("Owner credentials must be at least 4/12 characters");
  if(t2Rows_("Users").length)throw Error("Bootstrap only allowed for empty Users table");
  const salt=Utilities.getUuid()+Utilities.getUuid();
  t2Sheet_("Users").appendRow([Utilities.getUuid(),user,"owner","","",salt,t2Hash_(pass,salt),"active",new Date()]);
  props.deleteProperty("T2_BOOTSTRAP_OWNER_USER");
  props.deleteProperty("T2_BOOTSTRAP_OWNER_PASSWORD");
  t2Audit_("BOOTSTRAP_OWNER","system","Initial owner provisioned");
 }
 return "Installation complete";
}
/**
 * Read-only deployment diagnostic. Returns no personal data or credentials.
 * Run t2Preflight() from the Apps Script editor before deploying.
 */
function t2Preflight(){
 const result={databaseConfigured:false,requiredTables:false,ownerProvisioned:false,readyForLogin:false};
 try{
  const db=t2Db_();result.databaseConfigured=true;
  const required=["Users","AuditLog","Sessions","Rooms"];
  result.requiredTables=required.every(name=>!!db.getSheetByName(name));
  if(result.requiredTables){
   result.ownerProvisioned=t2Rows_("Users").some(u=>u.role==="owner"&&u.status==="active");
  }
  result.readyForLogin=result.requiredTables&&result.ownerProvisioned;
 }catch(e){result.error="Configuration or permissions incomplete"}
 return result;
}
/**
 * Run from the Apps Script editor only. Read-only role/security preflight.
 * No personal details, passwords, or session tokens are returned.
 */
function t2AuthPreflight(){
 const result={ok:false,usersSchema:false,sessionsSchema:false,roomsSchema:false,
  ownerCount:0,activeAdminCount:0,unassignedAdminCount:0,invalidRoleCount:0,duplicateUsernameCount:0,missingCredentialsCount:0};
 try{
  const expected={
   Users:["user_id","username","role","room_id","member_id","salt","password_hash","status","created_at"],
   Sessions:["token_hash","user_id","expires_at","revoked_at"],
   Rooms:["room_id","room_name","status"]
  };
  const db=t2Db_();
  for(const name of Object.keys(expected)){
   const sh=db.getSheetByName(name);
   const actual=sh&&sh.getLastRow()>0?sh.getRange(1,1,1,expected[name].length).getValues()[0].map(String):[];
   result[name.toLowerCase()+"Schema"]=expected[name].every((h,i)=>actual[i]===h);
  }
  if(!result.usersSchema||!result.sessionsSchema||!result.roomsSchema){result.error="Schema mismatch";console.log(JSON.stringify(result));return result}
  const rooms=new Set(t2Rows_("Rooms").filter(r=>r.status==="active").map(r=>String(r.room_id)));
  const usernames=new Set();
  for(const u of t2Rows_("Users")){
   const username=String(u.username||"").trim().toLowerCase();
   if(username&&usernames.has(username))result.duplicateUsernameCount++;
   if(username)usernames.add(username);
   if(!username||!String(u.salt||"")||!String(u.password_hash||""))result.missingCredentialsCount++;
   if(!["owner","admin","member"].includes(String(u.role)))result.invalidRoleCount++;
   if(u.status!=="active")continue;
   if(u.role==="owner")result.ownerCount++;
   if(u.role==="admin"){
    result.activeAdminCount++;
    if(!rooms.has(String(u.room_id)))result.unassignedAdminCount++;
   }
  }
  result.ok=result.ownerCount===1&&result.invalidRoleCount===0&&result.unassignedAdminCount===0&&result.duplicateUsernameCount===0&&result.missingCredentialsCount===0;
  console.log(JSON.stringify(result));
  return result;
 }catch(_){result.error="Configuration or permissions incomplete";console.log(JSON.stringify(result));return result}
}
function t2LockKey_(username){return "T2_FAIL_"+Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,username.toLowerCase())).slice(0,32)}
function login(payload){
 // Deprecated login entry point. Never process passwords or create sessions.
 // A separately reviewed identity provider must replace this function.
 return {ok:false,message:"ระบบเข้าสู่ระบบจริงยังไม่เปิดใช้งาน"};
}
/** No-write regression check for disabled legacy authentication. */
function t2LegacyLoginGateTest(){
 const result=login({username:"testuser",password:"dummy",role:"owner"});
 const report={ok:result.ok===false&&result.message==="ระบบเข้าสู่ระบบจริงยังไม่เปิดใช้งาน",legacyLoginEnabled:false};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Legacy login safety gate failed");
 return report;
}
/** Central session policy: only current token format and unrevoked, unexpired sessions. */
function t2ValidSessionToken_(token){
 return typeof token==="string"&&/^[a-f0-9-]{72}$/.test(token)&&
  token.charAt(8)==="-"&&token.charAt(13)==="-"&&token.charAt(18)==="-"&&
  token.charAt(23)==="-"&&token.charAt(44)==="-"&&token.charAt(49)==="-"&&
  token.charAt(54)==="-"&&token.charAt(59)==="-";
}
/** Token-format checks only; no database access or session creation. */
function t2SessionTokenTest(){
 const uuid="12345678-1234-1234-1234-123456789abc";
 const valid=uuid+uuid;
 const checks=[
  ["valid",t2ValidSessionToken_(valid)],
  ["short",!t2ValidSessionToken_("abc")],
  ["non_string",!t2ValidSessionToken_(null)],
  ["invalid_character",!t2ValidSessionToken_(valid.replace("a","z"))],
  ["extra_character",!t2ValidSessionToken_(valid+"0")],
  ["wrong_separator",!t2ValidSessionToken_(valid.replace("-","0"))]
 ];
 const report={ok:checks.every(x=>x[1]),results:checks.map(x=>({test:x[0],passed:x[1]}))};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Session token test failed");
 return report;
}
function t2SessionActive_(session,now){
 if(!session||session.revoked_at)return false;
 const expiry=new Date(session.expires_at).getTime();
 return Number.isFinite(expiry)&&expiry>now;
}
/** Pure policy test: no database reads, credentials, or session creation. */
function t2SessionPolicyTest(){
 const now=Date.now();
 const checks=[
  ["valid",t2SessionActive_({expires_at:new Date(now+60000),revoked_at:""},now)===true],
  ["expired",t2SessionActive_({expires_at:new Date(now-1),revoked_at:""},now)===false],
  ["boundary",t2SessionActive_({expires_at:new Date(now),revoked_at:""},now)===false],
  ["revoked",t2SessionActive_({expires_at:new Date(now+60000),revoked_at:new Date(now-1000)},now)===false],
  ["invalid_date",t2SessionActive_({expires_at:"invalid",revoked_at:""},now)===false],
  ["missing",t2SessionActive_(null,now)===false]
 ];
 const report={ok:checks.every(c=>c[1]),results:checks.map(c=>({test:c[0],passed:c[1]}))};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Session policy test failed");
 return report;
}
function t2Actor_(token){
 if(!t2ValidSessionToken_(token))throw Error("Unauthorized");
 const hash=t2SessionHash_(token);
 const sessions=t2Rows_("Sessions");
 const session=sessions.find(s=>s.token_hash===hash&&t2SessionActive_(s,Date.now()));
 if(!session)throw Error("Session expired");
 const actor=t2Rows_("Users").find(u=>u.user_id===session.user_id&&u.status==="active");
 if(!actor)throw Error("Unauthorized");
 return actor;
}
function dashboard(token){
 const actor=t2RequireRole_(token,["owner","admin","member"]);
 return {ok:true,role:actor.role,room_id:actor.role==="admin"?actor.room_id:null,member_id:actor.role==="member"?actor.member_id:null,mode:"authenticated",message:"เข้าสู่ระบบสำเร็จ ระบบข้อมูลสมาชิกและสลิปกำลังพัฒนา"};
}
function logout(token){
 if(!t2ValidSessionToken_(token))return {ok:false,error:"UNAUTHORIZED"};
 try{
  const hash=t2SessionHash_(token);
  const sh=t2Sheet_("Sessions");
  const vals=sh.getDataRange().getValues();
  for(let i=1;i<vals.length;i++){
   if(vals[i][0]===hash&&!vals[i][3]){
    sh.getRange(i+1,4).setValue(new Date());
    break;
   }
  }
  return {ok:true};
 }catch(_){return {ok:false,error:"LOGOUT_FAILED"}}
}

/**
 * V3 foundation: additive installation only. Never overwrite existing tables.
 * Member records are private; every endpoint checks session and server-side scope.
 */
const T2_V3_SCHEMAS_={
 Members:["member_id","full_name","id_number","room_id","phone","email","status","created_at"],
 Slips:["slip_id","member_id","room_id","transfer_at","amount","reference_last6","sender","receiver","status","drive_file_id","created_by","created_at"],
 Announcements:["post_id","title","body","category","room_id","pinned","created_by","created_at","status"],
 Comments:["comment_id","post_id","member_id","body","created_at","status"],
 Conversations:["conversation_id","member_id","updated_at"],
 Messages:["message_id","conversation_id","sender_user_id","body","created_at","read_at"]
};
function t2InstallV3(){
 const actorProperties=PropertiesService.getScriptProperties();
 if(!actorProperties.getProperty("T2_DB_ID"))throw Error("Set T2_DB_ID in Script Properties first");
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const db=t2Db_();const created=[];
  for(const name of Object.keys(T2_V3_SCHEMAS_)){
   const headers=T2_V3_SCHEMAS_[name];let sh=db.getSheetByName(name);
   if(!sh){sh=db.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);created.push(name)}
   else{
    const actual=sh.getLastColumn()?sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String):[];
    if(headers.some((h,i)=>actual[i]!==h))throw Error("Existing sheet incompatible, not modified: "+name);
   }
  }
  return {ok:true,created:created,existing:Object.keys(T2_V3_SCHEMAS_).filter(n=>!created.includes(n))};
 }finally{lock.releaseLock()}
}
function t2RequireRole_(token,roles){
 const actor=t2Actor_(token);
 if(!roles.includes(String(actor.role)))throw Error("Forbidden");
 if(actor.role==="admin"&&!String(actor.room_id||""))throw Error("Admin room not assigned");
 if(actor.role==="member"&&!String(actor.member_id||""))throw Error("Member identity not assigned");
 return actor;
}
/** Pure authorization policy, shared by server-side record endpoints. */
function t2CanReadMember_(actor,member){
 if(!actor||!member||String(member.status)!=="active")return false;
 if(actor.role==="owner")return true;
 if(actor.role==="admin")return !!actor.room_id&&String(actor.room_id)===String(member.room_id);
 if(actor.role==="member")return !!actor.member_id&&String(actor.member_id)===String(member.member_id);
 return false;
}
/** Run in the Apps Script editor: does not read or change any personal data. */
function t2AuthorizationPolicyTest(){
 const member={member_id:"M1",room_id:"R001",status:"active"};
 const cases=[
  ["owner_all",t2CanReadMember_({role:"owner"},member),true],
  ["admin_same_room",t2CanReadMember_({role:"admin",room_id:"R001"},member),true],
  ["admin_other_room",t2CanReadMember_({role:"admin",room_id:"R002"},member),false],
  ["admin_no_room",t2CanReadMember_({role:"admin"},member),false],
  ["member_self",t2CanReadMember_({role:"member",member_id:"M1"},member),true],
  ["member_other",t2CanReadMember_({role:"member",member_id:"M2"},member),false],
  ["unknown_role",t2CanReadMember_({role:"guest"},member),false],
  ["inactive_member",t2CanReadMember_({role:"owner"},Object.assign({},member,{status:"inactive"})),false]
 ];
 const results=cases.map(c=>({test:c[0],passed:c[1]===c[2]}));
 const report={ok:results.every(r=>r.passed),results};
 console.log(JSON.stringify(report));
 if(!report.ok)throw Error("Authorization policy test failed");
 return report;
}
function t2Rooms(token){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const sh=t2Sheet_("Rooms");const values=sh.getDataRange().getValues();
 const headers=values.shift().map(String);
 const records=values.map(row=>Object.fromEntries(headers.map((key,i)=>[key,row[i]])));
 const scoped=actor.role==="owner"?records:records.filter(r=>String(r.room_id)===String(actor.room_id));
 return {ok:true,rooms:scoped.map(r=>({room_id:String(r.room_id||""),name:String(r.name||r.room_name||r.room_id||"")}))};
}
/** Authenticated, server-scoped manual member registration. Not exposed through public doPost. */
function t2CreateMember(token,payload){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const p=payload||{};
 const name=String(p.full_name||"").trim().replace(/\s+/g," ");
 const id=String(p.id_number||"").trim();
 const phone=String(p.phone||"").trim();
 const email=String(p.email||"").trim().toLowerCase();
 const room=actor.role==="admin"?String(actor.room_id||""):String(p.room_id||"");
 if(name.length<3||name.length>160||/[<>\x00-\x1f]/.test(name))return {ok:false,error:"INVALID_NAME"};
 if(!/^\d{13}$/.test(id))return {ok:false,error:"INVALID_ID_NUMBER"};
 if(phone&&!/^0\d{8,9}$/.test(phone))return {ok:false,error:"INVALID_PHONE"};
 if(email&&(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return {ok:false,error:"INVALID_EMAIL"};
 if(!room||!t2Rows_("Rooms").some(r=>String(r.room_id)===room))return {ok:false,error:"INVALID_ROOM"};
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const rows=t2Rows_("Members");
  const normalize=n=>String(n||"").trim().replace(/^(นาย|นางสาว|นาง)\s*/,"").replace(/\s+/g," ").toLocaleLowerCase("th");
  if(rows.some(m=>String(m.id_number)===id||normalize(m.full_name)===normalize(name)))return {ok:false,error:"MEMBER_EXISTS"};
  const memberId="M"+Utilities.getUuid().replace(/-/g,"").slice(0,16).toUpperCase();
  t2Sheet_("Members").appendRow([memberId,name,id,room,phone,email,"active",new Date()]);
  t2Audit_("MEMBER_CREATED",actor.user_id,memberId);
  return {ok:true,member:{member_id:memberId,full_name:name,room_id:room}};
 }finally{lock.releaseLock()}
}
function t2FindMembers(token,query){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const term=String(query||"").trim().replace(/^(นาย|นางสาว|นาง)\s*/,"").replace(/\s+/g," ").toLocaleLowerCase("th");
 if(term.length<2||term.length>100)return {ok:false,message:"กรุณาระบุชื่ออย่างน้อย 2 ตัวอักษร"};
 const rows=t2Rows_("Members");
 const allowed=rows.filter(m=>t2CanReadMember_(actor,m));
 const matches=allowed.filter(m=>String(m.full_name||"").trim().replace(/^(นาย|นางสาว|นาง)\s*/,"").replace(/\s+/g," ").toLocaleLowerCase("th").includes(term)).slice(0,20);
 t2Audit_("MEMBER_SEARCH",actor.user_id,"results="+matches.length);
 return {ok:true,members:matches.map(m=>({member_id:String(m.member_id),full_name:String(m.full_name),room_id:String(m.room_id),status:String(m.status)}))};
}
function t2MyAccount(token){
 const actor=t2RequireRole_(token,["member"]);
 const row=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
 if(!row||String(row.status)!=="active")throw Error("Member not available");
 return {ok:true,profile:{member_id:String(row.member_id),full_name:String(row.full_name),room_id:String(row.room_id),phone:String(row.phone||""),email:String(row.email||"")}};
}
function t2V3Preflight(){
 const base=t2Preflight();const missing=[];
 try{const db=t2Db_();for(const name of Object.keys(T2_V3_SCHEMAS_))if(!db.getSheetByName(name))missing.push(name)}
 catch(e){return {ok:false,missing:Object.keys(T2_V3_SCHEMAS_),baseReady:base.readyForLogin}}
 return {ok:base.readyForLogin&&missing.length===0,missing:missing,baseReady:base.readyForLogin};
}

/** Authenticated feed and private messaging. All writes are text-only and audited. */
function t2Append_(name,values){const sh=t2Sheet_(name);sh.appendRow(values)}
function t2Text_(v,max){const t=String(v||"").trim();if(!t||t.length>max)throw Error("Invalid text length");return t}
function t2Feed(token){
 const actor=t2RequireRole_(token,["owner","admin","member"]);
 const posts=t2Rows_("Announcements").filter(p=>String(p.status)==="published"&&(actor.role==="owner"||String(p.room_id)==="all"||String(p.room_id)===(actor.role==="admin"?String(actor.room_id):t2MemberRoom_(actor))));
 const comments=t2Rows_("Comments").filter(c=>String(c.status)==="visible");
 return {ok:true,posts:posts.slice(-100).reverse().map(p=>({id:String(p.post_id),title:String(p.title),body:String(p.body),category:String(p.category),room:String(p.room_id),pinned:String(p.pinned)==="true",created:String(p.created_at),comments:comments.filter(c=>String(c.post_id)===String(p.post_id)).slice(-50).map(c=>({id:String(c.comment_id),author:"สมาชิก",text:String(c.body)}))}))};
}
function t2MemberRoom_(actor){
 const m=t2Rows_("Members").find(row=>String(row.member_id)===String(actor.member_id)&&String(row.status)==="active");
 if(!m)throw Error("Member unavailable");
 return String(m.room_id);
}
function t2Publish(token,payload){
 const actor=t2RequireRole_(token,["owner"]);const p=payload||{};
 const title=t2Text_(p.title,160),body=t2Text_(p.body,4000),category=String(p.category||"ข่าวสาร"),room=String(p.room||"all");
 if(!["ข่าวสาร","ประกาศ","กิจกรรม","สำคัญ"].includes(category))throw Error("Invalid category");
 if(room!=="all"&&!t2Rows_("Rooms").some(r=>String(r.room_id)===room))throw Error("Invalid room");
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const id=Utilities.getUuid();t2Append_("Announcements",[id,title,body,category,room,!!p.pinned,actor.user_id,new Date(),"published"]);t2Audit_("PUBLISH",actor.user_id,id);return {ok:true,id}}
 finally{lock.releaseLock()}
}
function t2Comment(token,postId,body){
 const actor=t2RequireRole_(token,["member"]);const id=t2Text_(postId,80),message=t2Text_(body,1000);
 const visible=t2Feed(token).posts.some(p=>p.id===id);if(!visible)throw Error("Post unavailable");
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const commentId=Utilities.getUuid();t2Append_("Comments",[commentId,id,actor.member_id,message,new Date(),"visible"]);t2Audit_("COMMENT",actor.user_id,id);return {ok:true,id:commentId}}
 finally{lock.releaseLock()}
}
function t2MyMessages(token){
 const actor=t2RequireRole_(token,["member","owner"]);
 if(actor.role==="owner")return {ok:true,conversations:t2Rows_("Conversations").slice(-100).map(c=>({id:String(c.conversation_id),member_id:String(c.member_id),updated:String(c.updated_at)}))};
 const conv=t2Rows_("Conversations").find(c=>String(c.member_id)===String(actor.member_id));
 if(!conv)return {ok:true,conversation_id:null,messages:[]};
 return {ok:true,conversation_id:String(conv.conversation_id),messages:t2Rows_("Messages").filter(m=>String(m.conversation_id)===String(conv.conversation_id)).slice(-100).map(m=>({sender:String(m.sender_user_id)===String(actor.user_id)?"me":"owner",text:String(m.body),created:String(m.created_at)}))};
}
function t2SendMessage(token,body,conversationId){
 const actor=t2RequireRole_(token,["member","owner"]);const message=t2Text_(body,2000);
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const conversations=t2Rows_("Conversations");let id;
  if(actor.role==="member"){
   const existing=conversations.find(c=>String(c.member_id)===String(actor.member_id));id=existing?String(existing.conversation_id):Utilities.getUuid();
   if(!existing)t2Append_("Conversations",[id,actor.member_id,new Date()]);
  }else{
   id=t2Text_(conversationId,80);
   if(!conversations.some(c=>String(c.conversation_id)===id))throw Error("Conversation unavailable");
  }
  t2Append_("Messages",[Utilities.getUuid(),id,actor.user_id,message,new Date(),""]);
  t2Audit_("MESSAGE",actor.user_id,id);return {ok:true,conversation_id:id};
 }finally{lock.releaseLock()}
}

/** Admin-only manual receipt entry; bank verification remains a human step. */
function t2SaveReceipt(token,p){
 const actor=t2RequireRole_(token,["admin"]);p=p||{};
 const memberId=String(p.member_id||"").trim();
 const member=t2Rows_("Members").find(m=>String(m.member_id)===memberId&&String(m.room_id)===String(actor.room_id)&&String(m.status)==="active");
 if(!member)throw Error("ไม่พบสมาชิกในห้องของคุณ กรุณาเลือกจาก Master");
 const date=String(p.date||""),time=String(p.time||"");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||!Number.isFinite(Date.parse(date+"T"+time+":00")))throw Error("วันเวลาไม่ถูกต้อง");
 const amount=Number(p.amount),ref=String(p.ref||"");
 if(!Number.isFinite(amount)||amount<=0||amount>100000000||Math.abs(Math.round(amount*100)-amount*100)>0.000001)throw Error("จำนวนเงินไม่ถูกต้อง");
 if(!/^\d{6}$/.test(ref))throw Error("รหัสท้ายสลิปต้องมี 6 หลัก");
 const sender=t2Text_(p.sender,120),receiver=t2Text_(p.receiver,120);
 const image=p.image||{};
 const mime=String(image.mime||"");
 if(!["image/jpeg","image/png","image/webp"].includes(mime))throw Error("ต้องแนบภาพ JPG PNG หรือ WEBP");
 const base64=String(image.base64||"");
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)||base64.length>3*1024*1024)throw Error("ภาพไม่ถูกต้องหรือมีขนาดเกิน 2 MB");
 const folderId=PropertiesService.getScriptProperties().getProperty("T2_SLIP_FOLDER_ID");
 if(!folderId)throw Error("ยังไม่ได้ตั้งค่าโฟลเดอร์เก็บสลิป T2_SLIP_FOLDER_ID");
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const key=[date,time,ref,sender.toLocaleLowerCase("th"),receiver.toLocaleLowerCase("th")].join("|");
  const duplicate=t2Rows_("Slips").find(r=>String(r.status)!=="deleted"&&[String(r.transfer_at).slice(0,10),String(r.transfer_at).slice(11,16),String(r.reference_last6),String(r.sender).toLocaleLowerCase("th"),String(r.receiver).toLocaleLowerCase("th")].join("|")===key);
  if(duplicate)return {ok:false,duplicate:true,message:"พบสลิปที่มีวันเวลา รหัสท้าย และผู้โอน/ผู้รับตรงกันแล้ว"};
  const bytes=Utilities.base64Decode(base64);if(bytes.length>2*1024*1024)throw Error("ภาพเกิน 2 MB");
  const id=Utilities.getUuid();
  const blob=Utilities.newBlob(bytes,mime,id+(mime==="image/png"?".png":mime==="image/webp"?".webp":".jpg"));
  const file=DriveApp.getFolderById(folderId).createFile(blob);
  try{
   t2Append_("Slips",[id,memberId,actor.room_id,date+"T"+time,amount,ref,sender,receiver,"pending_verification",file.getId(),actor.user_id,new Date()]);
  }catch(e){file.setTrashed(true);throw e}
  t2Audit_("RECEIPT_CREATE",actor.user_id,id);
  return {ok:true,slip_id:id,message:"บันทึกใบเสร็จแล้ว รอการยืนยันกับธนาคาร"};
 }finally{lock.releaseLock()}
}
/** Manual receipt metadata entry; no file uploads or public routes are enabled. */
function t2CreateSlip(token,payload){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const p=payload||{};
 const memberId=String(p.member_id||"").trim();
 const ref=String(p.reference_last6||"").trim();
 const sender=String(p.sender||"").trim();
 const receiver=String(p.receiver||"").trim();
 const note=String(p.note||"").trim();
 const amount=Number(p.amount);
 const dateText=String(p.transfer_at||"").trim();
 if(!/^[A-Za-z0-9-]{8,40}$/.test(memberId))return {ok:false,error:"INVALID_MEMBER"};
 if(!/^[0-9]{6}$/.test(ref))return {ok:false,error:"INVALID_REFERENCE"};
 if(!Number.isFinite(amount)||amount<=0||amount>1000000000||Math.abs(Math.round(amount*100)-amount*100)>0.000001)return {ok:false,error:"INVALID_AMOUNT"};
 if(!sender||sender.length>160||!receiver||receiver.length>160||note.length>1000)return {ok:false,error:"INVALID_DETAILS"};
 if([sender,receiver,note].some(x=>/^[=+\-@\t\r]/.test(x)))return {ok:false,error:"INVALID_SHEET_TEXT"};
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateText))return {ok:false,error:"INVALID_TRANSFER_DATE"};
 const transferDate=new Date(dateText+"+07:00");
 if(!Number.isFinite(transferDate.getTime()))return {ok:false,error:"INVALID_TRANSFER_DATE"};
 if(Utilities.formatDate(transferDate,"Asia/Bangkok","yyyy-MM-dd'T'HH:mm")!==dateText.slice(0,16))return {ok:false,error:"INVALID_TRANSFER_DATE"};
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const member=t2Rows_("Members").find(m=>String(m.member_id)===memberId&&String(m.status)==="active");
  if(!member||!t2CanReadMember_(actor,member))return {ok:false,error:"MEMBER_NOT_ACCESSIBLE"};
  const dup=t2Rows_("Slips").some(r=>String(r.status)!=="deleted"&&
   String(r.reference_last6)===ref&&new Date(r.transfer_at).getTime()===transferDate.getTime()&&
   String(r.sender).trim().toLocaleLowerCase("th")===sender.toLocaleLowerCase("th")&&
   String(r.receiver).trim().toLocaleLowerCase("th")===receiver.toLocaleLowerCase("th"));
  if(dup)return {ok:false,error:"DUPLICATE_SLIP"};
  const slipId="S"+Utilities.getUuid().replace(/-/g,"").slice(0,16).toUpperCase();
  t2Sheet_("Slips").appendRow([slipId,memberId,String(member.room_id),transferDate,amount,ref,sender,receiver,"pending_verification","",actor.user_id,new Date()]);
  t2Audit_("SLIP_CREATED",actor.user_id,slipId);
  return {ok:true,slip:{slip_id:slipId,member_id:memberId,amount:amount,status:"pending_verification"}};
 }finally{lock.releaseLock()}
}
/** Scoped receipt list for an authenticated admin or owner; no bank verification implied. */
function t2ListSlips(token,memberId,limit){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const id=String(memberId||"").trim();
 const max=Math.max(1,Math.min(200,Number(limit)||50));
 const members=t2Rows_("Members");
 const member=members.find(m=>String(m.member_id)===id&&t2CanReadMember_(actor,m));
 if(!member)return {ok:false,error:"MEMBER_NOT_ACCESSIBLE"};
 const slips=t2Rows_("Slips").filter(s=>String(s.member_id)===id&&String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 slips.sort((a,b)=>new Date(b.transfer_at).getTime()-new Date(a.transfer_at).getTime());
 return {ok:true,member:{member_id:id,full_name:String(member.full_name),room_id:String(member.room_id)},total:slips.length,slips:slips.slice(0,max).map(s=>({slip_id:String(s.slip_id),transfer_at:new Date(s.transfer_at).toISOString(),amount:Number(s.amount),reference_last6:String(s.reference_last6),sender:String(s.sender),receiver:String(s.receiver),status:String(s.status)}))};
}
/** Room-scoped financial summary. Pending receipts are not confirmed bank payments. */
/** Owner/admin receipt export, scoped before filtering; no public route. */
function t2ReceiptReport(token,filters){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const f=filters||{};
 const room=actor.role==="admin"?String(actor.room_id):String(f.room_id||"").trim();
 if(actor.role==="admin"&&f.room_id&&String(f.room_id)!==room)return {ok:false,error:"ROOM_NOT_ACCESSIBLE"};
 const from=String(f.from||"").trim(),to=String(f.to||"").trim();
 if(from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))return {ok:false,error:"INVALID_DATE"};
 if(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to))return {ok:false,error:"INVALID_DATE"};
 if(from&&to&&from>to)return {ok:false,error:"INVALID_RANGE"};
 if(room&&!t2Rows_("Rooms").some(r=>String(r.room_id)===room))return {ok:false,error:"INVALID_ROOM"};
 const members=t2Rows_("Members").filter(m=>t2CanReadMember_(actor,m)&&(!room||String(m.room_id)===room));
 const names=new Map(members.map(m=>[String(m.member_id),String(m.full_name)]));
 const memberFilter=String(f.member_id||"").trim();
 if(memberFilter&&!names.has(memberFilter))return {ok:false,error:"MEMBER_NOT_ACCESSIBLE"};
 const slips=t2Rows_("Slips").filter(s=>{
  if(!names.has(String(s.member_id))||String(s.status)==="deleted")return false;
  if(room&&String(s.room_id)!==room)return false;
  if(memberFilter&&String(s.member_id)!==memberFilter)return false;
  const day=Utilities.formatDate(new Date(s.transfer_at),"Asia/Bangkok","yyyy-MM-dd");
  return (!from||day>=from)&&(!to||day<=to);
 });
 slips.sort((a,b)=>new Date(b.transfer_at).getTime()-new Date(a.transfer_at).getTime());
 const rows=slips.slice(0,1000).map(s=>({
  slip_id:String(s.slip_id),member_id:String(s.member_id),member_name:names.get(String(s.member_id)),
  room_id:String(s.room_id),transfer_at:Utilities.formatDate(new Date(s.transfer_at),"Asia/Bangkok","yyyy-MM-dd HH:mm:ss"),
  sender:String(s.sender),receiver:String(s.receiver),reference_last6:String(s.reference_last6),
  amount:Number(s.amount),status:String(s.status)
 }));
 return {ok:true,total:slips.length,truncated:slips.length>rows.length,rows:rows};
}
/** Read-only owner reconciliation candidate list; bank confirmation stays manual. */
function t2ReconciliationQueue(token,limit){
 const actor=t2RequireRole_(token,["owner"]);
 const max=Math.max(1,Math.min(200,Math.floor(Number(limit)||50)));
 const names=new Map(t2Rows_("Members").map(m=>[String(m.member_id),String(m.full_name)]));
 const rows=t2Rows_("Slips").filter(s=>String(s.status)==="pending_verification");
 rows.sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
 return {ok:true,total:rows.length,items:rows.slice(0,max).map(s=>({
  slip_id:String(s.slip_id),member_id:String(s.member_id),member_name:names.get(String(s.member_id))||"",
  room_id:String(s.room_id),transfer_at:Utilities.formatDate(new Date(s.transfer_at),"Asia/Bangkok","yyyy-MM-dd HH:mm:ss"),
  amount:Number(s.amount),reference_last6:String(s.reference_last6),sender:String(s.sender),receiver:String(s.receiver),
  status:"pending_verification"
 }))};
}
function t2ReceiptSummary(token,roomId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const requested=String(roomId||"").trim();
 if(actor.role==="admin"&&requested&&requested!==String(actor.room_id))return {ok:false,error:"ROOM_NOT_ACCESSIBLE"};
 const room=actor.role==="admin"?String(actor.room_id):requested;
 const rooms=t2Rows_("Rooms");
 if(room&&!rooms.some(r=>String(r.room_id)===room))return {ok:false,error:"INVALID_ROOM"};
 const members=t2Rows_("Members").filter(m=>String(m.status)==="active"&&(!room||String(m.room_id)===room));
 const allowed=new Set(members.map(m=>String(m.member_id)));
 const slips=t2Rows_("Slips").filter(s=>allowed.has(String(s.member_id))&&String(s.status)!=="deleted"&&(!room||String(s.room_id)===room));
 const summary={ok:true,room_id:room||"all",member_count:members.length,receipt_count:slips.length,pending_count:0,verified_count:0,pending_amount:0,verified_amount:0,other_count:0};
 for(const slip of slips){
  const cents=Math.round(Number(slip.amount)*100);
  if(!Number.isSafeInteger(cents)||cents<0)continue;
  const status=String(slip.status);
  if(status==="pending_verification"){
   summary.pending_count++;
   summary.pending_amount+=cents;
  }else if(status==="verified"){
   summary.verified_count++;
   summary.verified_amount+=cents;
  }else summary.other_count++;
 }
 summary.pending_amount=summary.pending_amount/100;
 summary.verified_amount=summary.verified_amount/100;
 return summary;
}
function t2MemberSlips(token){
 const actor=t2RequireRole_(token,["member"]);return {ok:true,slips:t2Rows_("Slips").filter(s=>String(s.member_id)===String(actor.member_id)&&String(s.status)!=="deleted").slice(-200).map(s=>({transfer_at:String(s.transfer_at),amount:Number(s.amount),reference_last6:String(s.reference_last6),status:String(s.status)}))};
}


/**
 * One-time owner password recovery. Run ONLY from the Apps Script editor
 * under the project owner's Google account, never from the public web app.
 * Set T2_OWNER_RESET_PASSWORD in Script Properties to a NEW password first.
 * Remove the property automatically after successful reset.
 */
function t2ResetOwnerPasswordFromEditor(){
 const props=PropertiesService.getScriptProperties();
 const pass=String(props.getProperty("T2_OWNER_RESET_PASSWORD")||"");
 if(pass.length<12||pass.length>256)throw Error("Set T2_OWNER_RESET_PASSWORD (12-256 characters) in Script Properties first");
 const lock=LockService.getScriptLock();
 lock.waitLock(30000);
 try{
  const sh=t2Sheet_("Users");
  const rows=sh.getDataRange().getValues();
  const header=rows[0].map(String);
  const ix=Object.fromEntries(["user_id","username","role","salt","password_hash","status"].map(k=>[k,header.indexOf(k)]));
  if(Object.values(ix).some(i=>i<0))throw Error("Users schema mismatch");
  const owners=[];
  for(let i=1;i<rows.length;i++)if(String(rows[i][ix.username]).toLowerCase()==="t2owner"&&String(rows[i][ix.role])==="owner"&&String(rows[i][ix.status])==="active")owners.push(i+1);
  if(owners.length!==1)throw Error("Expected exactly one active t2owner; no changes made");
  const row=owners[0], userId=String(rows[row-1][ix.user_id]);
  const salt=Utilities.getUuid()+Utilities.getUuid();
  const hash=t2Hash_(pass,salt);
  sh.getRange(row,ix.salt+1).setValue(salt);
  sh.getRange(row,ix.password_hash+1).setValue(hash);
  // Invalidate existing sessions for this account.
  const sessions=t2Sheet_("Sessions"), sessionRows=sessions.getDataRange().getValues(), keys=sessionRows[0].map(String);
  const uid=keys.indexOf("user_id"),revoked=keys.indexOf("revoked_at");
  if(uid<0||revoked<0)throw Error("Sessions schema mismatch; password changed, review sessions manually");
  for(let i=1;i<sessionRows.length;i++)if(String(sessionRows[i][uid])===userId&&!sessionRows[i][revoked])sessions.getRange(i+1,revoked+1).setValue(new Date());
  props.deleteProperty("T2_OWNER_RESET_PASSWORD");
  t2Audit_("OWNER_PASSWORD_RESET",userId,"Reset from editor");
  return "Owner password reset completed";
 }finally{lock.releaseLock()}
}
