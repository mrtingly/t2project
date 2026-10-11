/** Owner bank request queue: read-only. */
function t2OwnerBankQueue(token){
 t2RequireRole_(token,["owner"]);
 const sheet=t2Db_().getSheetByName("MemberBankRequests");
 if(!sheet)return {ok:false,error:"BANK_SETUP_REQUIRED"};
 const rows=t2Rows_("MemberBankRequests").filter(r=>String(r.status)==="pending");
 return {ok:true,items:rows.slice(-100).map(r=>({request_id:String(r.request_id||""),member_id:String(r.member_id||""),bank_name:String(r.bank_name||""),account_last4:String(r.account_last4||""),status:"pending"}))};
}
