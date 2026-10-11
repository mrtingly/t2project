/**
 * T2PROJECT — fresh-start Apps Script server.
 * Deploy as HtmlService; NEVER publish user data or credentials in GitHub.
 * Requires a NEW private Google Spreadsheet ID in Script Properties:
 * T2_DB_ID = <new spreadsheet id>
 *
 * Bootstrap: set T2_BOOTSTRAP_OWNER_USER and T2_BOOTSTRAP_OWNER_PASSWORD
 * in Script Properties temporarily, run t2Install() from Apps Script editor,
 * then verify both bootstrap properties were removed.
 * Do not use a real national ID as a login credential.
 */
const T2_={users:"Users",audit:"AuditLog",sessions:"Sessions"};
function doGet(){
 return HtmlService.createHtmlOutputFromFile("index")
  .setTitle("T2PROJECT — เข้าสู่ระบบ")
  .addMetaTag("viewport","width=device-width, initial-scale=1");
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
 const token=Utilities.getUuid()+Utilities.getUuid(),tokenHash=t2Hash_(token,"SESSION");
 const expires=new Date(Date.now()+30*60*1000);
 t2Sheet_("Sessions").appendRow([tokenHash,user.user_id,expires,""]);
 t2Audit_("LOGIN",user.user_id,role);
 return {ok:true,token,role,displayName:role==="owner"?"Owner":role==="admin"?"Admin":"Member",expiresAt:expires.toISOString()};
}
function t2Actor_(token){
 if(typeof token!=="string"||token.length<50)throw Error("Unauthorized");
 const hash=t2Hash_(token,"SESSION");
 const session=t2Rows_("Sessions").find(s=>s.token_hash===hash&&!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now());
 if(!session)throw Error("Session expired");
 const actor=t2Rows_("Users").find(u=>u.user_id===session.user_id&&u.status==="active");
 if(!actor)throw Error("Unauthorized");
 return actor;
}
function dashboard(token){
 const actor=t2Actor_(token);
 return {ok:true,role:actor.role,room_id:actor.role==="admin"?actor.room_id:null,member_id:actor.role==="member"?actor.member_id:null,mode:"authenticated",message:"เข้าสู่ระบบสำเร็จ ระบบข้อมูลสมาชิกและสลิปกำลังพัฒนา"};
}
function logout(token){
 try{const hash=t2Hash_(token,"SESSION");const sh=t2Sheet_("Sessions");const vals=sh.getDataRange().getValues();for(let i=1;i<vals.length;i++)if(vals[i][0]===hash&&!vals[i][3])sh.getRange(i+1,4).setValue(new Date())}catch(_){}
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
 const allowed=actor.role==="owner"?rows:rows.filter(m=>String(m.room_id)===String(actor.room_id));
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
