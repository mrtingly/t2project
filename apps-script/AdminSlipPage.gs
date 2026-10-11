/** Admin/Owner paginated slips. Server enforces room scope for every request. */
function t2AdminSlipPage(token,memberId,page){
 const actor=t2RequireRole_(token,["admin","owner"]);
 const id=String(memberId||"").trim(),n=Number(page);
 if(!id||!Number.isInteger(n)||n<1||n>100000)return {ok:false,error:"INVALID_INPUT"};
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===id&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_FOUND_OR_AMBIGUOUS"};
 const member=matches[0];
 if(actor.role==="admin"&&String(member.room_id)!==String(actor.room_id))return {ok:false,error:"FORBIDDEN"};
 const slips=t2Rows_("Slips").filter(s=>String(s.member_id)===id&&String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 slips.sort((a,b)=>(new Date(b.transfer_at||0).getTime()||0)-(new Date(a.transfer_at||0).getTime()||0));
 return {ok:true,member_id:id,page:n,total:slips.length,items:slips.slice((n-1)*25,n*25).map(s=>({
  slip_id:String(s.slip_id||""),
  transfer_at:s.transfer_at instanceof Date?Utilities.formatDate(s.transfer_at,Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm"):String(s.transfer_at||""),
  amount:String(s.amount==null?"":s.amount),reference_last6:String(s.reference_last6||""),
  sender:String(s.sender||""),receiver:String(s.receiver||""),status:String(s.status||"")
 }))};
}
