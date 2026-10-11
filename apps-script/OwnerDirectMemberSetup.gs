/** One-time setup runner for the Apps Script editor only.
 * Set four Script Properties before execution:
 * T2_SETUP_OWNER_PASSWORD, T2_SETUP_MEMBER_ID,
 * T2_SETUP_MEMBER_USERNAME, T2_SETUP_MEMBER_PASSWORD.
 * Never run from a public web endpoint.
 */
function t2OwnerCreateMemberWithoutInvite(){
 const props=PropertiesService.getScriptProperties();
 const keys=["T2_SETUP_OWNER_PASSWORD","T2_SETUP_MEMBER_ID","T2_SETUP_MEMBER_USERNAME","T2_SETUP_MEMBER_PASSWORD"];
 const values=keys.map(k=>props.getProperty(k)||"");
 if(values.some(v=>!v))throw Error("SETUP_PROPERTIES_MISSING");
 const [ownerPassword,memberId,username,memberPassword]=values;
 let token=null;
 try{
  const owners=t2Rows_("Users").filter(u=>String(u.role)==="owner"&&String(u.status)==="active");
  if(owners.length!==1)throw Error("OWNER_NOT_UNIQUE");
  const owner=owners[0];
  const valid=t2PasswordVerify_(ownerPassword,String(owner.salt),String(owner.password_hash))||
   (!String(owner.salt).startsWith("pbkdf2-sha256:")&&
    t2Hash_(ownerPassword,String(owner.salt))===String(owner.password_hash));
  if(!valid)throw Error("OWNER_AUTH_FAILED");
  token=Utilities.getUuid()+Utilities.getUuid();
  t2Sheet_("Sessions").appendRow([t2SessionHash_(token),String(owner.user_id),new Date(Date.now()+60000),""]);
  const result=t2StaffCreateMemberLogin(token,memberId,username,memberPassword);
  if(!result.ok)throw Error("CREATE_MEMBER_FAILED: "+result.error);
  console.log("MEMBER_LOGIN_CREATED_SUCCESSFULLY");
  return {ok:true,created:true};
 }finally{
  if(token){try{logout(token)}catch(e){console.log("Temporary session cleanup failed")}}
  // Remove setup secrets regardless of success. On error, re-enter them before retrying.
  keys.forEach(k=>props.deleteProperty(k));
 }
}
