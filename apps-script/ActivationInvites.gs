/**
 * T2PROJECT: One-time activation invitation delivery.
 * Admin hands invitation to the independently verified member.
 * Never expose national ID as a credential. No public endpoint is enabled.
 */
const T2_INVITE_HEADERS_=["request_id","ticket_hash","expires_at","consumed_at","issued_by"];
function t2InstallActivationTickets(){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const db=t2Db_();let sh=db.getSheetByName("ActivationTickets");
  if(!sh){
   sh=db.insertSheet("ActivationTickets");
   sh.getRange(1,1,1,T2_INVITE_HEADERS_.length).setValues([T2_INVITE_HEADERS_]);
   sh.setFrozenRows(1);return {ok:true,created:true};
  }
  const actual=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  if(actual.join("|")!==T2_INVITE_HEADERS_.join("|"))throw Error("ActivationTickets schema mismatch");
  return {ok:true,created:false};
 }finally{lock.releaseLock()}
}
function t2InviteDigest_(ticket){
 return Utilities.base64EncodeWebSafe(Utilities.computeDigest(
  Utilities.DigestAlgorithm.SHA_256,"T2_INVITE_V1:"+String(ticket)));
}
function t2InviteValid_(ticket){
 return typeof ticket==="string"&&/^[0-9a-f-]{72}$/.test(ticket)&&
  ticket.charAt(8)==="-"&&ticket.charAt(44)==="-";
}
function t2InviteEligible_(activation,ticketRow,now){
 if(!activation||String(activation.status)!=="approved")return false;
 if(!ticketRow||String(ticketRow.request_id)!==String(activation.request_id))return false;
 if(ticketRow.consumed_at)return false;
 const expiry=new Date(ticketRow.expires_at).getTime();
 return Number.isFinite(expiry)&&expiry>now;
}
/**
 * Only an authorized Admin/Owner can issue a short-lived invitation.
 * Requires the activation request to have been approved.
 * Returns the raw invitation once for in-person delivery.
 * Never log the invitation; only its hash is stored.
 */
function t2AdminIssueActivationInvite(token,requestId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 if(!/^ACT-[0-9a-f-]{36}$/i.test(String(requestId||"")))
  return {ok:false,error:"INVALID_REQUEST_ID"};
 const lock=LockService.getScriptLock();if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const request=t2ActivationRows_().find(r=>String(r.request_id)===String(requestId));
  if(!request)return {ok:false,error:"NOT_FOUND"};
  const member=t2ActivationMember_(request.member_id);
  if(!t2ActivationCanManage_(actor,member))return {ok:false,error:"NOT_ACCESSIBLE"};
  if(String(request.status)!=="approved")return {ok:false,error:"NOT_APPROVED"};
  if(t2Rows_("Users").some(u=>String(u.member_id)===String(request.member_id)))
   return {ok:false,error:"ACCOUNT_ALREADY_EXISTS"};
  const sheet=t2Sheet_("ActivationTickets");
  const data=sheet.getDataRange().getValues();
  if(data.slice(1).some(r=>String(r[0])===String(requestId)&&
     !r[3]&&new Date(r[2]).getTime()>Date.now()))
   return {ok:false,error:"ACTIVE_INVITE_EXISTS"};
  const ticket=Utilities.getUuid()+Utilities.getUuid();
  const expires=new Date(Date.now()+15*60*1000);
  sheet.appendRow([String(requestId),t2InviteDigest_(ticket),expires,"",String(actor.user_id)]);
  t2Audit_("ACTIVATION_INVITE_ISSUED",actor.user_id,String(request.member_id));
  return {ok:true,invite:ticket,expires_at:expires.toISOString()};
 }finally{lock.releaseLock()}
}
/** A separate password-claim operation must consume the invitation atomically. */
function t2InvitePolicyTest(){
 const now=Date.now(),request={request_id:"R1",status:"approved"};
 const row={request_id:"R1",expires_at:new Date(now+10000),consumed_at:""};
 const checks=[
  ["eligible",t2InviteEligible_(request,row,now)],
  ["expired",!t2InviteEligible_(request,Object.assign({},row,{expires_at:new Date(now-1)}),now)],
  ["consumed",!t2InviteEligible_(request,Object.assign({},row,{consumed_at:new Date()}),now)],
  ["unapproved",!t2InviteEligible_(Object.assign({},request,{status:"pending_admin"}),row,now)],
  ["different_request",!t2InviteEligible_(request,Object.assign({},row,{request_id:"R2"}),now)]
 ];
 const report={ok:checks.every(c=>c[1]),checks:checks.map(c=>({name:c[0],passed:c[1]}))};
 if(!report.ok)throw Error("Activation invite policy failed");
 return report;
}

/** Read-only invitation state for an approved request; never return ticket/hash. */
function t2AdminInviteStatus(token,requestId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 if(!/^ACT-[0-9a-f-]{36}$/i.test(String(requestId||"")))
  return {ok:false,error:"INVALID_REQUEST_ID"};
 const request=t2ActivationRows_().find(r=>String(r.request_id)===String(requestId));
 if(!request)return {ok:false,error:"NOT_FOUND"};
 const member=t2ActivationMember_(request.member_id);
 if(!t2ActivationCanManage_(actor,member))return {ok:false,error:"NOT_ACCESSIBLE"};
 const rows=t2Rows_("ActivationTickets").filter(r=>String(r.request_id)===String(requestId));
 const latest=rows.length?rows[rows.length-1]:null;
 if(!latest)return {ok:true,status:"not_issued"};
 if(latest.consumed_at)return {ok:true,status:"consumed"};
 return {ok:true,status:new Date(latest.expires_at).getTime()>Date.now()?"active":"expired"};
}
