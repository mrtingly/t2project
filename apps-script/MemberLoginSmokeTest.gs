/** One-time Apps Script editor test; no public portal exposure.
 * Set T2_TEST_MEMBER_USERNAME and T2_TEST_MEMBER_PASSWORD in Script Properties.
 * This test removes both properties even if login fails.
 * Never log a password or session token.
 */
function t2VerifyCreatedMemberLogin(){
 const props=PropertiesService.getScriptProperties();
 const username=props.getProperty("T2_TEST_MEMBER_USERNAME");
 const password=props.getProperty("T2_TEST_MEMBER_PASSWORD");
 if(!username||!password)throw Error("TEST_CREDENTIALS_MISSING");
 let token=null;
 try{
  const result=t2MemberLogin(username,password);
  if(!result||!result.ok)throw Error("MEMBER_LOGIN_FAILED: "+(result&&result.error||"UNKNOWN"));
  token=result.token;
  const actor=t2RequireRole_(token,["member"]);
  const member=t2Rows_("Members").find(m=>String(m.member_id)===String(actor.member_id));
  if(!t2CanReadMember_(actor,member))throw Error("MEMBER_ACCESS_CHECK_FAILED");
  const profile=t2Rows_("Members").filter(m=>t2CanReadMember_(actor,m));
  if(profile.length!==1||String(profile[0].member_id)!==String(actor.member_id))
   throw Error("MEMBER_SCOPE_CHECK_FAILED");
  console.log("MEMBER_LOGIN_AND_SELF_ACCESS_PASSED");
  return {ok:true,role:"member",self_access:true};
 }finally{
  if(token){try{logout(token)}catch(e){console.log("Session cleanup failed")}}
  props.deleteProperty("T2_TEST_MEMBER_USERNAME");
  props.deleteProperty("T2_TEST_MEMBER_PASSWORD");
 }
}
