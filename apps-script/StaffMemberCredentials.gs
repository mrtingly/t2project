/**
 * T2PROJECT V2: staff-provisioned member credentials.
 * No invitation links, email confirmation, or OTP.
 * Called server-side by authenticated Owner/Admin only.
 * Does not expose credentials through a public doGet/doPost route.
 */
function t2StaffCreateMemberLogin(token,memberId,username,password){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const name=t2MemberUsername_(username);
 if(!name)return {ok:false,error:"INVALID_USERNAME"};
 const pw=t2DirectMemberPasswordPolicy_(password,name);
 if(!pw.ok)return pw;
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(30000))return {ok:false,error:"BUSY"};
 try{
  const members=t2Rows_("Members").filter(m=>String(m.member_id)===String(memberId));
  if(members.length!==1||!t2CanReadMember_(actor,members[0]))
   return {ok:false,error:"MEMBER_NOT_ACCESSIBLE"};
  const users=t2Rows_("Users");
  if(users.some(u=>String(u.username).trim().toLowerCase()===name))
   return {ok:false,error:"USERNAME_TAKEN"};
  if(users.some(u=>String(u.member_id)===String(memberId)))
   return {ok:false,error:"MEMBER_ALREADY_HAS_LOGIN"};
  const credential=t2PasswordCreate_(password);
  const id=Utilities.getUuid();
  t2Sheet_("Users").appendRow([id,name,"member",String(members[0].room_id),
    String(memberId),credential.salt,credential.password_hash,"active",new Date()]);
  t2Audit_("STAFF_MEMBER_LOGIN_CREATED",String(actor.user_id),String(memberId));
  return {ok:true,member_id:String(memberId),username:name};
 }finally{lock.releaseLock()}
}
function t2DirectMemberPasswordPolicy_(password,username){
 if(typeof password!=="string"||password.length<8||password.length>128)
  return {ok:false,error:"PASSWORD_LENGTH"};
 if(/\s/.test(password))return {ok:false,error:"PASSWORD_WHITESPACE"};
 if(username&&password.toLowerCase().includes(username))
  return {ok:false,error:"PASSWORD_CONTAINS_USERNAME"};
 if(/(.)\1{5,}/.test(password))return {ok:false,error:"PASSWORD_REPETITION"};
 return {ok:true};
}
/** Reset an existing member's password, preserving their username. */
function t2StaffResetMemberPassword(token,memberId,newPassword){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(30000))return {ok:false,error:"BUSY"};
 try{
  const members=t2Rows_("Members").filter(m=>String(m.member_id)===String(memberId));
  if(members.length!==1||!t2CanReadMember_(actor,members[0]))
   return {ok:false,error:"MEMBER_NOT_ACCESSIBLE"};
  const sh=t2Sheet_("Users"),rows=sh.getDataRange().getValues();
  const keys=rows[0].map(String);
  const ix=Object.fromEntries(keys.map((k,i)=>[k,i]));
  const matches=[];
  for(let i=1;i<rows.length;i++)if(String(rows[i][ix.member_id])===String(memberId)&&
     String(rows[i][ix.role])==="member")matches.push(i);
  if(matches.length!==1)return {ok:false,error:"ACCOUNT_NOT_UNIQUE"};
  const row=rows[matches[0]];
  const check=t2DirectMemberPasswordPolicy_(newPassword,String(row[ix.username]).toLowerCase());
  if(!check.ok)return check;
  const cred=t2PasswordCreate_(newPassword);
  sh.getRange(matches[0]+1,ix.salt+1).setValue(cred.salt);
  sh.getRange(matches[0]+1,ix.password_hash+1).setValue(cred.password_hash);
  const sessions=t2Sheet_("Sessions");
  const values=sessions.getDataRange().getValues();
  const sessionKeys=values[0].map(String);
  const uid=sessionKeys.indexOf("user_id"),revoked=sessionKeys.indexOf("revoked_at");
  if(uid<0||revoked<0)throw Error("Sessions schema mismatch");
  for(let i=1;i<values.length;i++)if(String(values[i][uid])===String(row[ix.user_id])&&!values[i][revoked])
    sessions.getRange(i+1,revoked+1).setValue(new Date());
  t2Audit_("STAFF_MEMBER_PASSWORD_RESET",String(actor.user_id),String(memberId));
  return {ok:true};
 }finally{lock.releaseLock()}
}
function t2DirectMemberPasswordPolicyTest(){
 const checks=[
  t2DirectMemberPasswordPolicy_("simplepass8","member001").ok,
  t2DirectMemberPasswordPolicy_("12345678","member001").ok,
  !t2DirectMemberPasswordPolicy_("short","member001").ok,
  !t2DirectMemberPasswordPolicy_("member001abc","member001").ok,
  !t2DirectMemberPasswordPolicy_("abc defghi","member001").ok
 ];
 if(!checks.every(Boolean))throw Error("Direct password policy failed");
 return {ok:true,checks:checks.length};
}
