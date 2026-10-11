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
 return t2Json_({ok:false,error:"API_POST_NOT_ENABLED"});
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
 if(!payload||typeof payload!=="object")return {ok:false,message:"ข้อมูลไม่ถูกต้อง"};
 const username=String(payload.username||"").trim(), password=String(payload.password||""), role=String(payload.role||"");
 if(!/^[a-zA-Z0-9._@-]{4,80}$/.test(username)||!["member","admin","owner"].includes(role)||!password||password.length>256)return {ok:false,message:"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"};
 const cache=CacheService.getScriptCache(),key=t2LockKey_(username);
 const failures=Number(cache.get(key)||0);
 if(failures>=5)return {ok:false,message:"ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที"};
 const user=t2Rows_("Users").find(u=>String(u.username).toLowerCase()===username.toLowerCase());
 const matched=user&&String(user.status)==="active"&&String(user.role)===role&&t2Hash_(password,String(user.salt))===String(user.password_hash);
 if(!matched){cache.put(key,String(failures+1),900);return {ok:false,message:"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"}}
 cache.remove(key);
 const token=Utilities.getUuid()+Utilities.getUuid(),tokenHash=t2SessionHash_(token);
 const expires=new Date(Date.now()+30*60*1000);
 t2Sheet_("Sessions").appendRow([tokenHash,user.user_id,expires,""]);
 t2Audit_("LOGIN",user.user_id,role);
 return {ok:true,token,role,displayName:role==="owner"?"Owner":role==="admin"?"Admin":"Member",expiresAt:expires.toISOString(),dashboard:{ok:true,role,room_id:role==="admin"?user.room_id:null,member_id:role==="member"?user.member_id:null}};
}
function t2Actor_(token){
 if(typeof token!=="string"||token.length<50)throw Error("Unauthorized");
 const hash=t2SessionHash_(token);
 const sessions=t2Rows_("Sessions");
 let session=sessions.find(s=>s.token_hash===hash&&!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now());
 // Compatibility for sessions created before the optimization.
 if(!session){const legacy=t2Hash_(token,"SESSION");session=sessions.find(s=>s.token_hash===legacy&&!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now())}
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
 try{const hash=t2SessionHash_(token);const sh=t2Sheet_("Sessions");const vals=sh.getDataRange().getValues();let found=false;for(let i=1;i<vals.length;i++)if(vals[i][0]===hash&&!vals[i][3]){sh.getRange(i+1,4).setValue(new Date());found=true}if(!found){const legacy=t2Hash_(token,"SESSION");for(let i=1;i<vals.length;i++)if(vals[i][0]===legacy&&!vals[i][3])sh.getRange(i+1,4).setValue(new Date())}}catch(_){}
 return {ok:true};
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
 if(!Number.isFinite(amount)||amount<=0||amount>100000000||Math.round(amount*100)!==amount*100)throw Error("จำนวนเงินไม่ถูกต้อง");
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
