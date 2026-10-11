/** Owner-only bank request review; changes request status, not payment instructions. */
function t2OwnerReviewBankRequest(token,requestId,decision){
 t2RequireRole_(token,["owner"]);
 if(typeof requestId!=="string"||!requestId||!["approved","rejected"].includes(decision))return {ok:false,error:"INVALID_INPUT"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sh=t2Db_().getSheetByName("MemberBankRequests");
  if(!sh)return {ok:false,error:"BANK_SETUP_REQUIRED"};
  const values=sh.getDataRange().getValues();
  const headers=values[0].map(String);
  const idCol=headers.indexOf("request_id"),statusCol=headers.indexOf("status");
  if(idCol<0||statusCol<0)return {ok:false,error:"INVALID_SCHEMA"};
  const index=values.findIndex((row,i)=>i>0&&String(row[idCol])===requestId);
  if(index<0)return {ok:false,error:"NOT_FOUND"};
  if(String(values[index][statusCol])!=="pending")return {ok:false,error:"ALREADY_REVIEWED"};
  sh.getRange(index+1,statusCol+1).setValue(decision);
  return {ok:true,status:decision};
 }finally{lock.releaseLock()}
}
