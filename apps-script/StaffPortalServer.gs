/** Staff-only room-scoped summary. Must be called from trusted Apps Script UI. */
function t2PortalStaffSummary(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["owner","admin"]);
 const members=t2Rows_("Members").filter(m=>t2CanReadMember_(actor,m));
 return {ok:true,role:String(actor.role),room_id:actor.role==="admin"?String(actor.room_id):null,
  member_count:members.length};
}
