/** Owner-only member slip details, read-only, with pagination. */
function t2OwnerMemberSlips(token,memberId,offset,limit){
 const actor=t2RequireRole_(token,["owner"]);
 if(!actor)return {ok:false,error:"FORBIDDEN"};
 const id=String(memberId||"").trim();
 if(!id)return {ok:false,error:"MEMBER_ID_REQUIRED"};
 const members=t2Rows_("Members").filter(m=>String(m.member_id||"").trim()===id);
 if(members.length!==1)return {ok:false,error:members.length?"DUPLICATE_MEMBER_ID":"MEMBER_NOT_FOUND"};
 const room=String(members[0].room_id||"");
 const start=Math.max(0,Math.floor(Number(offset)||0));
 const n=Number(limit);
 const size=Number.isFinite(n)?Math.max(1,Math.min(100,Math.floor(n))):25;
 const slips=t2Rows_("Slips").filter(s=>String(s.member_id||"").trim()===id&&String(s.room_id||"")===room&&String(s.status)!=="deleted");
 const items=slips.slice(start,start+size).map(s=>({
  slip_id:String(s.slip_id||""),date:String(s.date||s.transfer_date||""),amount:String(s.amount==null?"":s.amount),status:String(s.status||"")
 }));
 return {ok:true,member_id:id,full_name:String(members[0].full_name||""),total:slips.length,offset:start,items:items};
}
