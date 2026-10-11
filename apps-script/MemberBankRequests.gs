/** Member bank-change requests: verification workflow, no automatic payout changes. */
function t2InstallMemberBankRequests(){
 const db=t2Db_();
 if(!db.getSheetByName("MemberBankRequests"))db.insertSheet("MemberBankRequests").appendRow(["request_id","member_id","bank_name","account_last4","account_holder","status","requested_at"]);
 return "MemberBankRequests ready";
}
function t2PortalBankRequestInfo(token){
 const actor=t2PortalContactsActor_(token);
 if(!t2Db_().getSheetByName("MemberBankRequests"))return {ok:true,setup_required:true,requests:[]};
 const records=t2Rows_("MemberBankRequests").filter(x=>String(x.member_id)===String(actor.member_id));
 return {ok:true,requests:records.slice(-5).reverse().map(x=>({bank_name:String(x.bank_name||""),account_last4:String(x.account_last4||""),status:String(x.status||"")}))};
}
function t2PortalRequestBankChange(token,bankName,accountNumber,accountHolder){
 const actor=t2PortalContactsActor_(token);
 if(typeof bankName!=="string"||typeof accountNumber!=="string"||typeof accountHolder!=="string")return {ok:false,error:"INVALID_INPUT"};
 const bank=bankName.trim(),number=accountNumber.replace(/[ -]/g,""),holder=accountHolder.trim();
 if(!bank||bank.length>100||!holder||holder.length>150||/^[=+@]/.test(bank)||/^[=+@]/.test(holder)||!/^[0-9]{8,20}$/.test(number))return {ok:false,error:"INVALID_INPUT"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sheet=t2Db_().getSheetByName("MemberBankRequests");
  if(!sheet)return {ok:false,error:"BANK_SETUP_REQUIRED"};
  if(t2Rows_("MemberBankRequests").some(x=>String(x.member_id)===String(actor.member_id)&&String(x.status)==="pending"))return {ok:false,error:"PENDING_REVIEW"};
  sheet.appendRow([Utilities.getUuid(),String(actor.member_id),bank,number.slice(-4),holder,"pending",new Date()]);
  return {ok:true,status:"pending"};
 }finally{lock.releaseLock()}
}