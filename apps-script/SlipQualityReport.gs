/** Read-only Owner/Admin slip quality counters. Do not treat recorded slips as verified payments. */
function t2SlipQualityReport(token){
 const actor=t2RequireRole_(token,["owner","admin"]);
 const room=String(actor.room_id||"");
 const slips=t2Rows_("Slips").filter(s=>actor.role==="owner"||String(s.room_id)===room);
 const counts={total:0,pending_verification:0,deleted:0,other_status:0,invalid_amount:0,missing_reference:0,duplicate_reference_time:0};
 const seen=new Set();
 slips.forEach(s=>{
  counts.total++;
  const status=String(s.status||"");
  if(status==="deleted"){counts.deleted++;return}
  if(status==="pending_verification")counts.pending_verification++;else counts.other_status++;
  const amount=Number(s.amount);
  if(!Number.isFinite(amount)||amount<=0||String(s.amount).trim()==="")counts.invalid_amount++;
  const ref=String(s.reference_last6||"").trim();
  if(!/^[0-9]{6}$/.test(ref)){counts.missing_reference++;return}
  const date=s.transfer_at instanceof Date?s.transfer_at.getTime():new Date(s.transfer_at).getTime();
  const key=[ref,date,String(s.sender||"").trim().toLowerCase(),String(s.receiver||"").trim().toLowerCase()].join("|");
  if(seen.has(key))counts.duplicate_reference_time++;else seen.add(key);
 });
 return {ok:true,scope:actor.role==="owner"?"all":room,counts:counts,bank_verified:false};
}
