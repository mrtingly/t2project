/**
 * Same-origin Apps Script member portal.
 * Feature-gated: enable only after synthetic end-to-end security testing.
 * Credentials are handled by google.script.run, never URL query strings.
 */
function t2MemberPortalEnabled_(){
 return PropertiesService.getScriptProperties().getProperty("T2_MEMBER_PORTAL_ENABLED")==="true";
}
function t2MemberPortalPage_(){
 if(!t2MemberPortalEnabled_())return t2Json_({ok:false,error:"PORTAL_DISABLED"});
 return HtmlService.createHtmlOutputFromFile("MemberPortal")
  .setTitle("T2PROJECT | สมาชิก");
}
function t2PortalLogin(username,password){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 return t2MemberLogin(username,password);
}
function t2PortalMe(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const member=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const slips=t2Rows_("Slips").filter(s=>String(s.member_id)===String(actor.member_id)&&
  String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 return {ok:true,profile:{
  full_name:String(member.full_name||""),room_id:String(member.room_id||""),
  phone:String(member.phone||""),email:String(member.email||"")
 },summary:{slip_count:slips.length,amount_total:slips.reduce((n,s)=>n+(Number(s.amount)||0),0)}};
}
function t2PortalLogout(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 return logout(token);
}

// Member slip pagination is planned after data consistency verification.

function t2PortalSlipPage(token,page){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const member=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const n=Number(page);
 if(!Number.isInteger(n)||n<1||n>100000)return {ok:false,error:"INVALID_PAGE"};
 const all=t2Rows_("Slips").filter(s=>String(s.member_id)===String(actor.member_id)&&String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 all.sort((a,b)=>new Date(b.transfer_at).getTime()-new Date(a.transfer_at).getTime());
 const items=all.slice((n-1)*20,n*20).map(s=>({
  date:s.transfer_at instanceof Date?Utilities.formatDate(s.transfer_at,Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm"):String(s.transfer_at||""),
  amount:Number(s.amount)||0,
  ref:String(s.reference_last6||""),
  sender:String(s.sender||""),
  receiver:String(s.receiver||"")
 }));
 return {ok:true,page:n,total:all.length,items:items};
}

/** One-time additive setup. Does not alter existing member rows. */
function t2InstallMemberProfileExtra(){
 const db=t2Db_();
 let sheet=db.getSheetByName("MemberProfileExtra");
 if(!sheet){sheet=db.insertSheet("MemberProfileExtra");sheet.appendRow(["member_id","address","map_url","updated_at"])}
 return "MemberProfileExtra ready";
}
function t2PortalProfileExtra(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const member=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const sheet=t2Db_().getSheetByName("MemberProfileExtra");
 if(!sheet)return {ok:true,address:"",map_url:"",setup_required:true};
 const row=t2Rows_("MemberProfileExtra").find(x=>String(x.member_id)===String(actor.member_id));
 return {ok:true,address:String(row&&row.address||""),map_url:String(row&&row.map_url||"")};
}
function t2PortalSaveProfileExtra(token,address,mapUrl){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const member=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 if(typeof address!=="string"||address.length>1000||typeof mapUrl!=="string"||mapUrl.length>500)return {ok:false,error:"INVALID_INPUT"};
 const url=mapUrl.trim();
 if(url&&(!/^https:\/\/www\.google\.com\/maps\//.test(url)&&!/^https:\/\/maps\.app\.goo\.gl\//.test(url)))return {ok:false,error:"INVALID_MAP_URL"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sheet=t2Db_().getSheetByName("MemberProfileExtra");
  if(!sheet)return {ok:false,error:"PROFILE_SETUP_REQUIRED"};
  const values=sheet.getDataRange().getValues();
  const index=values.findIndex((r,i)=>i>0&&String(r[0])===String(actor.member_id));
  const data=[String(actor.member_id),address.trim(),url,new Date()];
  if(index<0)sheet.appendRow(data);else sheet.getRange(index+1,1,1,4).setValues([data]);
  return {ok:true};
 }finally{lock.releaseLock()}
}
