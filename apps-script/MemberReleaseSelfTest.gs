/** Run these pure checks from the Apps Script editor before deployment. */
function t2MemberReleaseSelfTest(){
 const checks=[
  ["activation",t2ActivationRegressionSuite],
  ["invite",t2InvitePolicyTest],
  ["account",t2MemberAccountPolicyTest],
  ["password",t2PasswordKdfTest],
  ["login",t2MemberLoginPolicyTest],
  ["throttle",t2MemberThrottlePolicyTest],
  ["room_access",t2RoomAccessRegressionTest],
  ["session",t2SessionPolicyTest],
  ["token",t2SessionTokenTest]
 ];
 const results=[];
 for(const pair of checks){
  try{const r=pair[1]();results.push({name:pair[0],ok:r.ok===true})}
  catch(e){results.push({name:pair[0],ok:false,error:String(e.message||e)})}
 }
 const report={ok:results.every(r=>r.ok),results:results};
 console.log(JSON.stringify(report));
 return report;
}
