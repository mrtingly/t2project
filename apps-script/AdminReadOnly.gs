/** Scoped admin read-only summary. Owner may inspect all rooms. */
function t2AdminSummary(token){
 const actor=t2RequireRole_(token,["admin","owner"]);
 const room=String(actor.room_id||"");
 const members=t2Rows_("Members").filter(m=>actor.role==="owner"||String(m.room_id)===room);
 const allowed=new Set(members.filter(m=>String(m.status)==="active").map(m=>String(m.member_id)+"|"+String(m.room_id)));
 let slipCount=0,totalAmount=0,invalid=0;
 t2Rows_("Slips").forEach(s=>{
  if(String(s.status)==="deleted")return;
  if(actor.role!=="owner"&&String(s.room_id)!==room)return;
  if(!allowed.has(String(s.member_id)+"|"+String(s.room_id))){invalid++;return;}
  const raw=String(s.amount==null?"":s.amount).trim(),amount=Number(raw);
  if(!raw||!Number.isFinite(amount)||amount<=0){invalid++;return;}
  slipCount++;totalAmount+=amount;
 });
 return {ok:true,scope:actor.role==="owner"?"all":room,member_count:members.length,slip_count:slipCount,amount_total:totalAmount,unverified_or_invalid:invalid,bank_verified:false};
}
/** Scoped member search. Never returns national IDs or contact information. */
function t2AdminFindMembers(token,query){
 const actor=t2RequireRole_(token,["admin","owner"]);
 const q=String(query||"").trim().toLowerCase();
 if(q.length<2||q.length>100)return {ok:false,error:"INVALID_QUERY"};
 const matches=t2Rows_("Members").filter(m=>(actor.role==="owner"||String(m.room_id)===String(actor.room_id))&&String(m.status)==="active"&&String(m.full_name||"").toLowerCase().includes(q));
 return {ok:true,total:matches.length,items:matches.slice(0,50).map(m=>({member_id:String(m.member_id),full_name:String(m.full_name),room_id:String(m.room_id)}))};
}
