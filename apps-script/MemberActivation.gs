/**
 * T2PROJECT — one-time member activation state policy.
 * No public endpoint, no password hashing, and no automatic activation.
 * Member identity must be verified and activation approved by assigned Admin.
 *
 * Member statuses: active (profile exists) / suspended.
 * Activation statuses: unclaimed -> pending_admin -> approved -> claimed.
 * Once claimed, name + national ID can NEVER be used as login credentials.
 */
const T2_MEMBER_ACTIVATION_={
  UNCLAIMED:"unclaimed",PENDING:"pending_admin",APPROVED:"approved",CLAIMED:"claimed"
};
function t2MemberActivationDecision_(actor,member,activation){
 if(!actor||!member||!activation)return {ok:false,error:"INVALID_REQUEST"};
 if(!["owner","admin"].includes(String(actor.role)))return {ok:false,error:"FORBIDDEN"};
 if(String(member.status)!=="active")return {ok:false,error:"MEMBER_INACTIVE"};
 if(String(actor.role)==="admin"&&
   (!String(actor.room_id||"")||String(actor.room_id)!==String(member.room_id)))
  return {ok:false,error:"ROOM_NOT_ACCESSIBLE"};
 if(String(activation.member_id)!==String(member.member_id))
  return {ok:false,error:"MEMBER_MISMATCH"};
 if(String(activation.status)!==T2_MEMBER_ACTIVATION_.PENDING)
  return {ok:false,error:"NOT_PENDING"};
 if(String(activation.approved_by||""))return {ok:false,error:"ALREADY_APPROVED"};
 return {ok:true,next_status:T2_MEMBER_ACTIVATION_.APPROVED};
}
function t2MemberClaimPolicy_(member,activation,existingUser){
 if(!member||!activation)return {ok:false,error:"INVALID_REQUEST"};
 if(String(member.status)!=="active")return {ok:false,error:"MEMBER_INACTIVE"};
 if(String(activation.member_id)!==String(member.member_id))
  return {ok:false,error:"MEMBER_MISMATCH"};
 if(String(activation.status)!==T2_MEMBER_ACTIVATION_.APPROVED)
  return {ok:false,error:"NOT_APPROVED"};
 if(existingUser)return {ok:false,error:"ACCOUNT_ALREADY_CLAIMED"};
 return {ok:true,next_status:T2_MEMBER_ACTIVATION_.CLAIMED};
}
function t2MemberActivationPolicyTest(){
 const member={member_id:"M1",room_id:"A",status:"active"};
 const pending={member_id:"M1",status:"pending_admin",approved_by:""};
 const approved={member_id:"M1",status:"approved"};
 const checks=[
  ["same_room_admin",t2MemberActivationDecision_({role:"admin",room_id:"A"},member,pending).ok],
  ["other_room_blocked",!t2MemberActivationDecision_({role:"admin",room_id:"B"},member,pending).ok],
  ["unassigned_admin_blocked",!t2MemberActivationDecision_({role:"admin"},member,pending).ok],
  ["member_cannot_approve",!t2MemberActivationDecision_({role:"member"},member,pending).ok],
  ["no_double_approval",!t2MemberActivationDecision_({role:"owner"},member,approved).ok],
  ["approved_claim",t2MemberClaimPolicy_(member,approved,null).ok],
  ["no_claim_before_approval",!t2MemberClaimPolicy_(member,pending,null).ok],
  ["no_double_claim",!t2MemberClaimPolicy_(member,approved,{user_id:"U1"}).ok],
  ["claimed_cannot_reclaim",!t2MemberClaimPolicy_(member,{member_id:"M1",status:"claimed"},null).ok]
 ];
 const report={ok:checks.every(c=>c[1]),results:checks.map(c=>({name:c[0],passed:c[1]}))};
 if(!report.ok)throw Error("Member activation policy failed");
 return report;
}

function t2MemberActivationStatus_(status){
 const allowed=["unclaimed","pending_admin","approved","claimed"];
 return allowed.includes(String(status))?String(status):"invalid";
}

function t2ActivationCanTransition_(from,to){
 const allowed={unclaimed:["pending_admin"],pending_admin:["approved","unclaimed"],approved:["claimed","pending_admin"],claimed:[]};
 return Object.prototype.hasOwnProperty.call(allowed,String(from))&&allowed[String(from)].includes(String(to));
}

function t2ActivationTransitionTest(){
 const checks=[["request",t2ActivationCanTransition_("unclaimed","pending_admin")],["approve",t2ActivationCanTransition_("pending_admin","approved")],["claim",t2ActivationCanTransition_("approved","claimed")],["no_reclaim",!t2ActivationCanTransition_("claimed","unclaimed")],["no_skip",!t2ActivationCanTransition_("unclaimed","claimed")],["invalid",!t2ActivationCanTransition_("unknown","claimed")]];
 const result={ok:checks.every(c=>c[1]),results:checks.map(c=>({name:c[0],passed:c[1]}))};
 if(!result.ok)throw Error("Activation transition policy failed");
 return result;
}

/**
 * Activation storage is additive: does not alter Members or Users schemas.
 * Install only from the trusted Apps Script editor after code review.
 */
const T2_ACTIVATION_HEADERS_=["request_id","member_id","status","requested_at","approved_by","approved_at","claimed_at"];
function t2InstallMemberActivation(){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const db=t2Db_();let sh=db.getSheetByName("MemberActivations");
  if(!sh){sh=db.insertSheet("MemberActivations");sh.getRange(1,1,1,T2_ACTIVATION_HEADERS_.length).setValues([T2_ACTIVATION_HEADERS_]);sh.setFrozenRows(1);return {ok:true,created:true}}
  const current=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  if(current.join("|")!==T2_ACTIVATION_HEADERS_.join("|"))throw Error("Activation schema mismatch");
  return {ok:true,created:false};
 }finally{lock.releaseLock()}
}
function t2ActivationRows_(){return t2Rows_("MemberActivations")}
function t2ActivationMember_(memberId){
 return t2Rows_("Members").find(m=>String(m.member_id)===String(memberId));
}
function t2ActivationCanManage_(actor,member){
 return !!actor&&!!member&&String(member.status)==="active"&&
 (actor.role==="owner"||(actor.role==="admin"&&!!String(actor.room_id||"")&&String(actor.room_id)===String(member.room_id)));
}
/** Admin begins an activation request only AFTER checking the applicant's identity.
 * This endpoint is editor/internal only; public doPost is still disabled.
 */
function t2AdminStartMemberActivation(token,memberId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const member=t2ActivationMember_(memberId);
 if(!/^M[A-F0-9]{16}$/.test(String(memberId||"")))return {ok:false,error:"INVALID_MEMBER_ID"};
 if(!t2ActivationCanManage_(actor,member))return {ok:false,error:"NOT_ACCESSIBLE"};
 const lock=LockService.getScriptLock();if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const existing=t2ActivationRows_().find(r=>String(r.member_id)===String(memberId));
  if(existing)return {ok:false,error:"ACTIVATION_ALREADY_EXISTS",status:String(existing.status)};
  if(t2Rows_("Users").some(u=>String(u.member_id)===String(memberId)))
   return {ok:false,error:"ACCOUNT_ALREADY_EXISTS"};
  const id="ACT-"+Utilities.getUuid();
  t2Sheet_("MemberActivations").appendRow([id,String(memberId),"pending_admin",new Date(),"","",""]);
  t2Audit_("ACTIVATION_REQUESTED",actor.user_id,String(memberId));
  return {ok:true,request_id:id,status:"pending_admin"};
 }finally{lock.releaseLock()}
}
/** Admin approval records identity check; does NOT issue a session. */
function t2AdminApproveMemberActivation(token,requestId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 if(!/^ACT-[0-9a-f-]{36}$/i.test(String(requestId||"")))return {ok:false,error:"INVALID_REQUEST_ID"};
 const lock=LockService.getScriptLock();if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const sh=t2Sheet_("MemberActivations"),data=sh.getDataRange().getValues();
  const idx=data.findIndex((r,i)=>i>0&&String(r[0])===String(requestId));
  if(idx<1)return {ok:false,error:"REQUEST_NOT_FOUND"};
  const r=data[idx],member=t2ActivationMember_(r[1]);
  if(!t2ActivationCanManage_(actor,member))return {ok:false,error:"NOT_ACCESSIBLE"};
  const policy=t2MemberActivationDecision_(actor,member,{member_id:r[1],status:r[2],approved_by:r[4]});
  if(!policy.ok)return policy;
  if(t2Rows_("Users").some(u=>String(u.member_id)===String(r[1])))
   return {ok:false,error:"ACCOUNT_ALREADY_EXISTS"};
  sh.getRange(idx+1,3).setValue("approved");
  sh.getRange(idx+1,5,1,2).setValues([[String(actor.user_id),new Date()]]);
  t2Audit_("ACTIVATION_APPROVED",actor.user_id,String(r[1]));
  return {ok:true,status:"approved",request_id:String(requestId)};
 }finally{lock.releaseLock()}
}
/** Scoped queue. Never return national IDs or passwords. */
function t2AdminActivationQueue(token){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const members=t2Rows_("Members");
 const visible=new Map(members.filter(m=>t2ActivationCanManage_(actor,m)).map(m=>[String(m.member_id),m]));
 const requests=t2ActivationRows_().filter(r=>String(r.status)==="pending_admin"&&visible.has(String(r.member_id)));
 return {ok:true,items:requests.slice(0,200).map(r=>({
  request_id:String(r.request_id),member_id:String(r.member_id),
  full_name:String(visible.get(String(r.member_id)).full_name),
  room_id:String(visible.get(String(r.member_id)).room_id),status:"pending_admin"
 }))};
}

/** Reject an unclaimed request without deleting its audit history.
 * A rejected request is terminal; any retry requires a reviewed recovery process.
 */
function t2AdminRejectMemberActivation(token,requestId){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const lock=LockService.getScriptLock();if(!lock.tryLock(15000))return {ok:false,error:"BUSY"};
 try{
  const sh=t2Sheet_("MemberActivations"),data=sh.getDataRange().getValues();
  const idx=data.findIndex((r,i)=>i>0&&String(r[0])===String(requestId));
  if(idx<1)return {ok:false,error:"REQUEST_NOT_FOUND"};
  const r=data[idx],member=t2ActivationMember_(r[1]);
  if(!t2ActivationCanManage_(actor,member))return {ok:false,error:"NOT_ACCESSIBLE"};
  if(String(r[2])!=="pending_admin")return {ok:false,error:"NOT_PENDING"};
  sh.getRange(idx+1,3).setValue("rejected");
  sh.getRange(idx+1,5,1,2).setValues([[String(actor.user_id),new Date()]]);
  t2Audit_("ACTIVATION_REJECTED",actor.user_id,String(r[1]));
  return {ok:true,status:"rejected"};
 }finally{lock.releaseLock()}
}
/** Pure tests: no Sheets writes, no personal data. */
function t2ActivationScopeTest(){
 const m={member_id:"M1",room_id:"A",status:"active"};
 const checks=[
  ["owner",t2ActivationCanManage_({role:"owner"},m)],
  ["assigned_admin",t2ActivationCanManage_({role:"admin",room_id:"A"},m)],
  ["other_admin_blocked",!t2ActivationCanManage_({role:"admin",room_id:"B"},m)],
  ["unassigned_admin_blocked",!t2ActivationCanManage_({role:"admin"},m)],
  ["member_blocked",!t2ActivationCanManage_({role:"member",room_id:"A"},m)],
  ["suspended_blocked",!t2ActivationCanManage_({role:"owner"},Object.assign({},m,{status:"suspended"}))]
 ];
 const report={ok:checks.every(x=>x[1]),results:checks.map(x=>({name:x[0],passed:x[1]}))};
 if(!report.ok)throw Error("Activation scope policy failed");
 return report;
}

function t2ActivationCounts_(rows){
 const counts={pending_admin:0,approved:0,claimed:0,rejected:0};
 for(const r of rows||[]){const status=String(r.status||"");if(Object.prototype.hasOwnProperty.call(counts,status))counts[status]++;}
 return counts;
}

function t2AdminActivationSummary(token){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const allowed=new Set(t2Rows_("Members").filter(m=>t2ActivationCanManage_(actor,m)).map(m=>String(m.member_id)));
 const rows=t2ActivationRows_().filter(r=>allowed.has(String(r.member_id)));
 return {ok:true,counts:t2ActivationCounts_(rows)};
}

function t2ActivationCountsTest(){
 const result=t2ActivationCounts_([{status:"pending_admin"},{status:"approved"},{status:"claimed"},{status:"rejected"},{status:"rejected"},{status:"unknown"}]);
 const ok=result.pending_admin===1&&result.approved===1&&result.claimed===1&&result.rejected===2;
 if(!ok)throw Error("Activation counts failed");
 return {ok:ok,counts:result};
}

/** Admin-only activation history, filtered before any response is built. */
function t2AdminActivationHistory(token,status,limit){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const filter=String(status||"");
 if(filter&&!["pending_admin","approved","claimed","rejected"].includes(filter))
  return {ok:false,error:"INVALID_STATUS"};
 const max=Math.min(100,Math.max(1,Math.floor(Number(limit)||25)));
 const members=new Map(t2Rows_("Members").filter(m=>t2ActivationCanManage_(actor,m))
  .map(m=>[String(m.member_id),m]));
 const rows=t2ActivationRows_().filter(r=>members.has(String(r.member_id))&&
  (!filter||String(r.status)===filter));
 rows.sort((a,b)=>new Date(b.requested_at).getTime()-new Date(a.requested_at).getTime());
 return {ok:true,items:rows.slice(0,max).map(r=>({
  request_id:String(r.request_id),member_id:String(r.member_id),
  full_name:String(members.get(String(r.member_id)).full_name),
  status:String(r.status),room_id:String(members.get(String(r.member_id)).room_id)
 }))};
}

function t2ActivationHistoryFilterTest(){
 const statuses=["pending_admin","approved","claimed","rejected"];
 const ok=statuses.every(s=>t2MemberActivationStatus_(s)===s)&&
  t2MemberActivationStatus_("invalid")==="invalid"&&
  !t2ActivationCanTransition_("claimed","approved");
 if(!ok)throw Error("Activation history status policy failed");
 return {ok:true,allowed_statuses:statuses};
}

/** Summary by room for Owner; Admin is restricted to their own room. */
function t2ActivationRoomSummary(token){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const members=t2Rows_("Members").filter(m=>t2ActivationCanManage_(actor,m));
 const roomOf=new Map(members.map(m=>[String(m.member_id),String(m.room_id)]));
 const result={};
 for(const m of members){
  const room=String(m.room_id);
  if(!Object.prototype.hasOwnProperty.call(result,room))
   result[room]={members:0,pending_admin:0,approved:0,claimed:0,rejected:0};
  result[room].members++;
 }
 for(const r of t2ActivationRows_()){
  const room=roomOf.get(String(r.member_id));
  if(room&&Object.prototype.hasOwnProperty.call(result[room],String(r.status)))
   result[room][String(r.status)]++;
 }
 return {ok:true,rooms:Object.keys(result).sort().map(room_id=>({
  room_id:room_id,counts:result[room_id]
 }))};
}

/** One place to run all pure activation policy checks; no Sheets writes. */
function t2ActivationRegressionSuite(){
 const tests=[
  ["approval",t2MemberActivationPolicyTest],
  ["transition",t2ActivationTransitionTest],
  ["scope",t2ActivationScopeTest],
  ["counts",t2ActivationCountsTest],
  ["history",t2ActivationHistoryFilterTest]
 ];
 const results=tests.map(pair=>{
  try{const outcome=pair[1]();return {name:pair[0],ok:outcome.ok===true}}
  catch(error){return {name:pair[0],ok:false,error:String(error.message||error)}}
 });
 const report={ok:results.every(r=>r.ok),results:results};
 if(!report.ok)throw Error("Activation regression suite failed: "+JSON.stringify(results));
 return report;
}
