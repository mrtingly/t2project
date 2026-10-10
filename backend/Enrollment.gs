/**
 * T2PROJECT V3 — Member enrollment service (server-side Apps Script).
 *
 * IMPORTANT: Not a standalone login system. It requires a trusted, server-verified
 * authentication identity (e.g. Firebase Auth ID token verified on the server).
 * A name + 13-digit ID number is NOT adequate authentication.
 * No raw ID numbers, enrollment secrets or passwords are written to Sheets.
 *
 * Registration sequence:
 * 1. Admin, authenticated to their room, verifies member offline.
 * 2. Admin issues a short-lived, single-use invitation to that member.
 * 3. Member signs in with a verified identity provider and redeems invitation.
 * 4. The provider UID is linked to exactly one member record.
 * Subsequent logins use the identity provider, never the national ID number.
 */
const V3_ENROLLMENT_HEADERS=[
 "invitation_id","member_id","room_id","secret_hash","expires_at",
 "consumed_at","issued_by","created_at"
];
const V3_IDENTITY_HEADERS=["provider_uid","member_id","linked_at","status"];
function v3EnsureEnrollmentSheets_(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss)throw new Error("Spreadsheet not configured");
 [["EnrollmentInvitations",V3_ENROLLMENT_HEADERS],
  ["IdentityLinks",V3_IDENTITY_HEADERS]].forEach(([name,headers])=>{
   let sh=ss.getSheetByName(name);
   if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);}
   else if(sh.getLastColumn()!==headers.length || sh.getRange(1,1,1,headers.length).getValues()[0].join("|")!==headers.join("|"))
     throw new Error("Unexpected sheet layout: "+name);
 });
}
function v3Rows_(name){
 const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
 if(!sh)throw new Error("Missing sheet "+name);
 const values=sh.getDataRange().getValues();
 const headers=values.shift().map(String);
 return values.filter(r=>r.some(x=>x!=="")).map((r,i)=>({row:i+2,data:Object.fromEntries(headers.map((h,j)=>[h,r[j]]))}));
}
function v3Sha256_(input){
 return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,input,Utilities.Charset.UTF_8)
   .map(x=>("0"+(x&255).toString(16)).slice(-2)).join("");
}
function v3NewSecret_(){
 // Generate a high-entropy token via multiple independent UUIDs; no short numeric PINs.
 return [Utilities.getUuid(),Utilities.getUuid(),Utilities.getUuid()].join("");
}
function v3CreateEnrollmentInvitation_(actor,memberId){
 if(!actor || !actor.verified || actor.role!=="ADMIN")throw new Error("Admin login required");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
   v3EnsureEnrollmentSheets_();
   const m=v3Rows_("Members").find(x=>String(x.data.member_id)===String(memberId));
   if(!m)throw new Error("Member not found");
   v3Authorize_(actor,V3_ACTIONS.EDIT_MEMBER,{room_id:String(m.data.room_id)});
   if(v3Rows_("IdentityLinks").some(x=>String(x.data.member_id)===String(memberId)&&String(x.data.status)==="ACTIVE"))
     throw new Error("Member already enrolled");
   const secret=v3NewSecret_(), id=Utilities.getUuid(), now=new Date();
   const expires=new Date(now.getTime()+30*60*1000);
   SpreadsheetApp.getActiveSpreadsheet().getSheetByName("EnrollmentInvitations")
     .appendRow([id,memberId,m.data.room_id,v3Sha256_(id+":"+secret),expires,"",actor.user_id,now]);
   // Show secret only once to the authenticated admin for secure delivery.
   return {invitation_id:id,invitation_secret:secret,expires_at:expires.toISOString()};
 }finally{lock.releaseLock();}
}
/**
 * providerIdentity must be obtained by a server-side verification function,
 * NEVER accepted directly from client input.
 */
function v3RedeemEnrollmentInvitation_(providerIdentity,invitationId,secret){
 if(!providerIdentity || providerIdentity.verified!==true ||
    !providerIdentity.uid || !providerIdentity.emailVerified)
   throw new Error("Verified provider identity required");
 if(typeof invitationId!=="string" || typeof secret!=="string" || secret.length<80)
   throw new Error("Invalid invitation");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
   v3EnsureEnrollmentSheets_();
   const links=v3Rows_("IdentityLinks");
   if(links.some(x=>String(x.data.provider_uid)===providerIdentity.uid && String(x.data.status)==="ACTIVE"))
     throw new Error("Identity already linked");
   const invitation=v3Rows_("EnrollmentInvitations").find(x=>String(x.data.invitation_id)===invitationId);
   if(!invitation || invitation.data.consumed_at ||
      new Date(invitation.data.expires_at).getTime()<=Date.now() ||
      v3Sha256_(invitationId+":"+secret)!==String(invitation.data.secret_hash))
     throw new Error("Invitation invalid or expired");
   if(links.some(x=>String(x.data.member_id)===String(invitation.data.member_id) && String(x.data.status)==="ACTIVE"))
     throw new Error("Member already enrolled");
   const ss=SpreadsheetApp.getActiveSpreadsheet(), now=new Date();
   // Mark invitation consumed before linking; if append fails, Admin must issue a new invitation.
   ss.getSheetByName("EnrollmentInvitations").getRange(invitation.row,6).setValue(now);
   ss.getSheetByName("IdentityLinks").appendRow([providerIdentity.uid,invitation.data.member_id,now,"ACTIVE"]);
   return {member_id:String(invitation.data.member_id),linked:true};
 }finally{lock.releaseLock();}
}
