/** Owner-only, read-only member investment summary. No estimated returns. */
function t2OwnerMemberSummary(token,limit){
 const actor=t2RequireRole_(token,["owner"]);
 if(!actor)return {ok:false,error:"FORBIDDEN"};
 const requested=limit==null?50:Number(limit);
 const max=Number.isFinite(requested)?Math.min(200,Math.max(1,Math.floor(requested))):50;
 const members=t2Rows_("Members"),slips=t2Rows_("Slips");
 const summary=new Map();
 let total_amount=0,total_slips=0;
 let unmatched_slips=0,invalid_amount_slips=0,duplicate_member_ids=0,duplicate_slip_ids=0,missing_slip_ids=0;
 const slipIdCounts=new Map();
 slips.forEach(s=>{if(String(s.status)!=="deleted"){const id=String(s.slip_id||"").trim();if(id)slipIdCounts.set(id,(slipIdCounts.get(id)||0)+1);}});
 const duplicateIds=new Set();
 members.forEach(m=>{
  const id=String(m.member_id||"").trim();
  if(!id||summary.has(id)){
   duplicate_member_ids++;
   if(id)duplicateIds.add(id);
   return;
  }
  summary.set(id,{member_id:id,full_name:String(m.full_name||""),room_id:String(m.room_id||""),slip_count:0,amount_total:0});
 });
 slips.forEach(s=>{
  if(String(s.status)==="deleted")return;
  const slipId=String(s.slip_id||"").trim();
  if(!slipId){missing_slip_ids++;return;}
  if((slipIdCounts.get(slipId)||0)>1){duplicate_slip_ids++;return;}
  const entry=summary.get(String(s.member_id));
  if(!entry||duplicateIds.has(String(s.member_id))||entry.room_id!==String(s.room_id)){unmatched_slips++;return;}
  const rawAmount=String(s.amount==null?"":s.amount).trim();
  const amount=Number(rawAmount);
  if(!rawAmount||!Number.isFinite(amount)||amount<=0){invalid_amount_slips++;return;}
  entry.slip_count++;entry.amount_total+=amount;
  total_slips++;total_amount+=amount;
 });
 const items=Array.from(summary.values()).sort((a,b)=>a.full_name.localeCompare(b.full_name,"th")).slice(0,max);
 return {ok:true,total_members:summary.size,total_slips:total_slips,total_amount:total_amount,items:items,returns_calculated:false,quality:{unmatched_slips:unmatched_slips,invalid_amount_slips:invalid_amount_slips,duplicate_member_ids:duplicate_member_ids,duplicate_slip_ids:duplicate_slip_ids,missing_slip_ids:missing_slip_ids}};
}
