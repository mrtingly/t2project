/**
 * T2PROJECT V3 — KYC-approved account recovery state machine.
 * Requires Schema.gs + Access.gs. No public endpoint or password provider wired yet.
 * Recovery does NOT unlock member profile or reveal financial records.
 */
const V3_RECOVERY_HEADERS=[
 "recovery_id","member_id","room_id","approved_by","kyc_method",
 "kyc_reference","approved_at","expires_at","status","attempts","consumed_at"
];
function v3RecoverySheet_(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss)throw new Error("No spreadsheet configured");
 let sh=ss.getSheetByName("AccountRecovery");
 if(!sh){
   sh=ss.insertSheet("AccountRecovery");
   sh.getRange(1,1,1,V3_RECOVERY_HEADERS.length).setValues([V3_RECOVERY_HEADERS]);
   sh.setFrozenRows(1);
 }
 const actual=sh.getRange(1,1,1,V3_RECOVERY_HEADERS.length).getValues()[0];
 if(actual.join("|")!==V3_RECOVERY_HEADERS.join("|"))throw new Error("Unexpected recovery sheet schema");
 return sh;
}
function v3RecoveryRows_(){
 const sh=v3RecoverySheet_(), values=sh.getDataRange().getValues();
 return values.slice(1).map((row,i)=>({
  row:i+2,
  data:Object.fromEntries(V3_RECOVERY_HEADERS.map((h,j)=>[h,row[j]]))
 })).filter(x=>x.data.recovery_id);
}
function v3RecoveryMember_(memberId){
 const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Members");
 if(!sh)throw new Error("Missing Members sheet");
 const values=sh.getDataRange().getValues(), cols=values.shift();
 const idIndex=cols.indexOf("member_id"),roomIndex=cols.indexOf("room_id");
 if(idIndex<0||roomIndex<0)throw new Error("Invalid Members schema");
 const matches=values.filter(r=>String(r[idIndex])===String(memberId));
 if(matches.length!==1)throw new Error("Member record not unique or missing");
 return {member_id:String(matches[0][idIndex]),room_id:String(matches[0][roomIndex])};
}
/**
 * Call ONLY from a handler that resolves actor using trusted server session.
 * kycEvidence is an internal attestation by an authenticated Admin, not a
 * client-provided 'passed=true' flag. Record evidence reference, not ID photos.
 */
function v3ApproveRecovery_(actor,memberId,kycEvidence){
 if(!actor||!actor.verified||actor.status!=="ACTIVE"||actor.role!=="ADMIN"||!actor.user_id)
   throw new Error("Authenticated Admin required");
 if(!kycEvidence||kycEvidence.verifiedBy!==actor.user_id||
    !["IN_PERSON_ID_CHECK","CALLBACK_REGISTERED_NUMBER_WITH_SECOND_FACTOR"].includes(kycEvidence.method)||
    !/^[A-Za-z0-9_-]{8,100}$/.test(String(kycEvidence.reference||"")))
   throw new Error("Documented KYC verification required");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
   const member=v3RecoveryMember_(memberId);
   v3Authorize_(actor,V3_ACTIONS.EDIT_MEMBER,{room_id:member.room_id});
   const sh=v3RecoverySheet_(),now=new Date();
   v3RecoveryRows_().forEach(x=>{
     if(String(x.data.member_id)===member.member_id&&x.data.status==="APPROVED")
       sh.getRange(x.row,9).setValue("REVOKED");
   });
   const id=Utilities.getUuid(), expiry=new Date(now.getTime()+15*60*1000);
   sh.appendRow([id,member.member_id,member.room_id,actor.user_id,
     kycEvidence.method,kycEvidence.reference,now,expiry,"APPROVED",0,""]);
   const audit=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AuditLog");
   if(!audit)throw new Error("Missing AuditLog sheet");
   audit.appendRow([Utilities.getUuid(),actor.user_id,"RECOVERY_KYC_APPROVED",
     "Member",member.member_id,"",JSON.stringify({recovery_id:id,kyc_method:kycEvidence.method,
     kyc_reference:kycEvidence.reference}),now]);
   return {recovery_id:id,expires_at:expiry.toISOString()};
 }finally{lock.releaseLock();}
}
/**
 * Internal eligibility check. No profile access is granted.
 * Caller MUST separately enforce name+ID match, IP/account rate limiting
 * and independent proof from approved KYC; never expose result to anonymous callers.
 */
function v3RecoveryEligible_(memberId){
 const now=Date.now();
 return v3RecoveryRows_().some(x=>String(x.data.member_id)===String(memberId)&&
   x.data.status==="APPROVED"&&Number(x.data.attempts)<3&&
   new Date(x.data.expires_at).getTime()>now);
}
/**
 * Called only AFTER a secure credential service has successfully changed the
 * username/password and revoked old sessions. Do not call on mere form submit.
 * The credential service must use a suitable password KDF and uniqueness checks.
 */
function v3CompleteRecovery_(memberId,recoveryId,credentialServiceReceipt){
 if(!credentialServiceReceipt||credentialServiceReceipt.verified!==true||
    credentialServiceReceipt.member_id!==memberId||
    credentialServiceReceipt.recovery_id!==recoveryId||
    credentialServiceReceipt.oldSessionsRevoked!==true)
   throw new Error("Verified credential reset receipt required");
 const lock=LockService.getScriptLock();lock.waitLock(15000);
 try{
   const sh=v3RecoverySheet_(),rec=v3RecoveryRows_().find(x=>x.data.recovery_id===recoveryId);
   if(!rec||String(rec.data.member_id)!==String(memberId)||
      rec.data.status!=="APPROVED"||new Date(rec.data.expires_at).getTime()<=Date.now())
     throw new Error("Recovery authorization expired or used");
   const now=new Date();
   sh.getRange(rec.row,9).setValue("CONSUMED");
   sh.getRange(rec.row,11).setValue(now);
   SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AuditLog").appendRow([
     Utilities.getUuid(),"SYSTEM","RECOVERY_COMPLETED","Member",memberId,"",
     JSON.stringify({recovery_id:recoveryId}),now
   ]);
   return {completed:true};
 }finally{lock.releaseLock();}
}
