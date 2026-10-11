/** Server-authorized, room-scoped staff overview. No identity numbers or secrets. */
function t2PortalStaffSummary(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["owner","admin"]);
 const members=t2Rows_("Members").filter(m=>t2CanReadMember_(actor,m));
 const allowed=new Set(members.map(m=>String(m.member_id)));
 const slips=t2Rows_("Slips").filter(s=>allowed.has(String(s.member_id))&&
  (actor.role==="owner"||String(s.room_id)===String(actor.room_id))&&
  String(s.status)!=="deleted");
 return {ok:true,role:String(actor.role),
  room_id:actor.role==="admin"?String(actor.room_id):null,
  totals:{members:members.length,slips:slips.length,
   amount:slips.reduce((sum,s)=>sum+(Number(s.amount)||0),0)},
  members:members.slice(0,100).map(m=>({
   member_id:String(m.member_id),full_name:String(m.full_name),room_id:String(m.room_id)
  }))};
}
/** Delegates per-member slip authorization to existing server function. */
function t2PortalStaffMember(token,memberId){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 t2RequireRole_(token,["owner","admin"]);
 return t2ListSlips(token,String(memberId||""),50);
}
