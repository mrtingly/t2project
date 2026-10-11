/** Owner-only read-only search across member records. */
function t2OwnerFindMembers(token,query,limit){
 const actor=t2RequireRole_(token,["owner"]);
 if(!actor)return {ok:false,error:"FORBIDDEN"};
 const q=String(query||"").trim().toLocaleLowerCase("th");
 if(q.length<2||q.length>100)return {ok:false,error:"INVALID_QUERY"};
 const n=Number(limit);
 const max=Number.isFinite(n)?Math.max(1,Math.min(50,Math.floor(n))):25;
 const matches=t2Rows_("Members").filter(m=>{
  const name=String(m.full_name||"").toLocaleLowerCase("th");
  const id=String(m.member_id||"").toLocaleLowerCase("th");
  return name.includes(q)||id===q;
 });
 return {ok:true,total_matches:matches.length,items:matches.slice(0,max).map(m=>({
  member_id:String(m.member_id||""),full_name:String(m.full_name||""),room_id:String(m.room_id||"")
 }))};
}
