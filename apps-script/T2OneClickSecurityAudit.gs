/**
 * T2PROJECT V2 - one-click READ-ONLY pre-release audit.
 * No account creation, no writes, no live credentials, no public route.
 * Keep T2_MEMBER_PORTAL_ENABLED=false until all end-to-end tests pass.
 */
function t2OneClickSecurityAudit(){
  const results=[];
  const check=(name,fn)=>{
    try{
      if(typeof fn!=="function")throw Error("TEST_NOT_INSTALLED");
      const r=fn();
      results.push({name:name,ok:!!r&&r.ok===true,details:r&&r.checks||null});
    }catch(e){results.push({name:name,ok:false,error:String(e&&e.message||e)})}
  };
  check("portal_disabled",function(){
    const flag=PropertiesService.getScriptProperties().getProperty("T2_MEMBER_PORTAL_ENABLED");
    if(flag==="true")throw Error("PORTAL_ENABLED_UNSAFE");
    const r=doGet({parameter:{action:"member_portal"}});
    const body=JSON.parse(r.getContent());
    return {ok:body&&body.ok===false&&body.error==="PORTAL_DISABLED"};
  });
  check("activation",typeof t2ActivationRegressionSuite==="function"?t2ActivationRegressionSuite:null);
  check("invite",typeof t2InvitePolicyTest==="function"?t2InvitePolicyTest:null);
  check("account",typeof t2MemberAccountPolicyTest==="function"?t2MemberAccountPolicyTest:null);
  check("password",typeof t2PasswordKdfTest==="function"?t2PasswordKdfTest:null);
  check("login",typeof t2MemberLoginPolicyTest==="function"?t2MemberLoginPolicyTest:null);
  check("session",typeof t2SessionPolicyTest==="function"?t2SessionPolicyTest:null);
  check("token",typeof t2SessionTokenTest==="function"?t2SessionTokenTest:null);
  check("room_scope",function(){
    if(typeof t2CanReadMember_!=="function")throw Error("MISSING_AUTHORIZATION");
    const m={member_id:"M1",room_id:"A",status:"active"};
    const assertions=[
      t2CanReadMember_({role:"owner"},m),
      t2CanReadMember_({role:"admin",room_id:"A"},m),
      !t2CanReadMember_({role:"admin",room_id:"B"},m),
      t2CanReadMember_({role:"member",member_id:"M1"},m),
      !t2CanReadMember_({role:"member",member_id:"M2"},m),
      !t2CanReadMember_(null,m),
      !t2CanReadMember_({role:"guest"},m),
      !t2CanReadMember_({role:"owner"},Object.assign({},m,{status:"inactive"}))
    ];
    return {ok:assertions.every(Boolean),checks:assertions.length};
  });
  check("staff_scope",function(){
    if(typeof t2CanReadMember_!=="function")throw Error("MISSING_AUTHORIZATION");
    const members=[{member_id:"M1",room_id:"A",status:"active"},
      {member_id:"M2",room_id:"B",status:"active"},
      {member_id:"M3",room_id:"A",status:"inactive"}];
    const visible=a=>members.filter(m=>t2CanReadMember_(a,m)).map(m=>m.member_id).join(",");
    const assertions=[
      visible({role:"admin",room_id:"A"})==="M1",
      visible({role:"admin",room_id:"B"})==="M2",
      visible({role:"owner"})==="M1,M2",
      visible({role:"admin"})==="",
      visible({role:"member",member_id:"M1"})==="M1"
    ];
    return {ok:assertions.every(Boolean),checks:assertions.length};
  });
  check("login_throttle_installed",function(){
    return {ok:typeof t2MemberLoginThrottle_==="function"&&
      typeof t2MemberThrottlePolicyTest==="function"};
  });
  const report={ok:results.every(x=>x.ok),passed:results.filter(x=>x.ok).length,
    total:results.length,results:results,
    live_login_verified:false,public_url_verified:false,ready_for_public_launch:false};
  console.log(JSON.stringify(report));
  return report;
}
