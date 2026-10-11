/** Owner-only, read-only member investment summary. No estimated returns. */
function t2OwnerMemberSummary(token,limit){
 const actor=t2RequireRole_(token,["owner"]);
 if(!actor)return {ok:false,error:"FORBIDDEN"};
 const requested=Number(limit);
 const max=Number.isFinite(requested)?Math.min(200,Math.max(1,Math.floor(requested))):50;
 const members=t2Rows_("Members"),slips=t2Rows_("Slips");
 const summary=new Map();
 let unmatched_slips=0,invalid_amount_slips=0;
 members.forEach(m=>summary.set(String(m.member_id),{member_id:String(m.member_id),full_name:String(m.full_name||""),room_id:String(m.room_id||""),slip_count:0,amount_total:0}));
 slips.forEach(s=>{
  if(String(s.status)==="deleted")return;
  const entry=summary.get(String(s.member_id));
  if(!entry||entry.room_id!==String(s.room_id)){unmatched_slips++;return;}
  const amount=Number(s.amount);
  if(!Number.isFinite(amount)||amount<0){invalid_amount_slips++;return;}
  entry.slip_count++;entry.amount_total+=amount;
 });
 const items=Array.from(summary.values()).sort((a,b)=>a.full_name.localeCompare(b.full_name,"th")).slice(0,max);
 return {ok:true,total_members:summary.size,items:items,returns_calculated:false,quality:{unmatched_slips:unmatched_slips,invalid_amount_slips:invalid_amount_slips}};
}
