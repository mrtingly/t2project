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
  String(s.room_id)===String(member.room_id));
 return {ok:true,profile:{
  full_name:String(member.full_name||""),room_id:String(member.room_id||""),
  phone:String(member.phone||""),email:String(member.email||"")
 },summary:{slip_count:slips.length,amount_total:slips.reduce((n,s)=>n+(Number(s.amount)||0),0)}};
}
function t2PortalLogout(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 return logout(token);
}
