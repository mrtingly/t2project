/** Soft-delete a receipt. Never remove evidence from the sheet. */
function t2AdminVoidSlip(token,slipId,reason){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const id=String(slipId||"").trim(),why=String(reason||"").trim();
 if(!/^[A-Za-z0-9-]{8,50}$/.test(id)||why.length<8||why.length>300||/^[=+@-]/.test(why)||/[\x00-\x1f]/.test(why))
  return {ok:false,error:"INVALID_INPUT"};
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const sh=t2Sheet_("Slips"),values=sh.getDataRange().getValues();
  const headers=values[0].map(String),idCol=headers.indexOf("slip_id"),statusCol=headers.indexOf("status"),memberCol=headers.indexOf("member_id"),roomCol=headers.indexOf("room_id");
  if([idCol,statusCol,memberCol,roomCol].some(n=>n<0))return {ok:false,error:"SCHEMA_MISMATCH"};
  const matches=[];
  for(let i=1;i<values.length;i++)if(String(values[i][idCol])===id)matches.push(i);
  if(matches.length!==1)return {ok:false,error:"SLIP_NOT_FOUND_OR_AMBIGUOUS"};
  const row=values[matches[0]],member=t2Rows_("Members").find(m=>String(m.member_id)===String(row[memberCol])&&String(m.room_id)===String(row[roomCol])&&String(m.status)==="active");
  if(t2Rows_("Members").filter(m=>String(m.member_id)===String(row[memberCol])&&String(m.room_id)===String(row[roomCol])&&String(m.status)==="active").length!==1)return {ok:false,error:"AMBIGUOUS_MEMBER"};
  if(!member||!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
  if(String(row[statusCol])==="deleted")return {ok:false,error:"ALREADY_DELETED"};
  sh.getRange(matches[0]+1,statusCol+1).setValue("deleted");
  try{t2Audit_("SLIP_VOID",String(actor.user_id),id+" reason="+why)}catch(e){return {ok:false,error:"VOID_APPLIED_AUDIT_FAILED",slip_id:id,status:"deleted"}}
  return {ok:true,slip_id:id,status:"deleted"};
 }finally{lock.releaseLock()}
}
