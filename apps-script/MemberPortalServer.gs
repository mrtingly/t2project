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
