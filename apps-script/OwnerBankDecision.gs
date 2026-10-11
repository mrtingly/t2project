/** Owner-only bank request review; changes request status, not payment instructions. */
function t2OwnerReviewBankRequest(token,requestId,decision){
 const actor=t2RequireRole_(token,["owner"]);
 if(!actor)return {ok:false,error:"FORBIDDEN"};
 if(typeof requestId!=="string"||!requestId||!["approved","rejected"].includes(decision))return {ok:false,error:"INVALID_INPUT"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sh=t2Db_().getSheetByName("MemberBankRequests");
  if(!sh)return {ok:false,error:"BANK_SETUP_REQUIRED"};
  const values=sh.getDataRange().getValues();
  const headers=values[0].map(String);
  const idCol=headers.indexOf("request_id"),statusCol=headers.indexOf("status");
  if(idCol<0||statusCol<0)return {ok:false,error:"INVALID_SCHEMA"};
  const matching=values.reduce((acc,row,i)=>i>0&&String(row[idCol])===requestId?acc.concat(i):acc,[]);
  if(matching.length>1)return {ok:false,error:"DUPLICATE_REQUEST_ID"};
  const index=matching.length?matching[0]:-1;
  if(index<0)return {ok:false,error:"NOT_FOUND"};
  if(String(values[index][statusCol])!=="pending")return {ok:false,error:"ALREADY_REVIEWED"};
  const audit=t2Db_().getSheetByName("MemberBankAudit");
  if(!audit)return {ok:false,error:"AUDIT_SETUP_REQUIRED"};
  const memberIdCol=headers.indexOf("member_id");
  if(memberIdCol<0)return {ok:false,error:"INVALID_SCHEMA"};
  const memberId=String(values[index][memberIdCol]);
  const reviewer=String(actor.user_id||actor.admin_id||actor.member_id||"");
  if(!reviewer)return {ok:false,error:"REVIEWER_ID_MISSING"};
  const auditRows=audit.getDataRange().getValues();
  const existing=auditRows.find((r,i)=>i>0&&String(r[1])===requestId);
  if(existing){
   if(String(existing[3])!==decision)return {ok:false,error:"AUDIT_CONFLICT"};
  }else{
   audit.appendRow([new Date(),requestId,memberId,decision,reviewer]);
   SpreadsheetApp.flush();
  }
  sh.getRange(index+1,statusCol+1).setValue(decision);
  return {ok:true,status:decision};
 }finally{lock.releaseLock()}
}
