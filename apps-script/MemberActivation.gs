/**
 * T2PROJECT — one-time member activation state policy.
 * No public endpoint, no password hashing, and no automatic activation.
 * Member identity must be verified and activation approved by assigned Admin.
 *
 * Member statuses: active (profile exists) / suspended.
 * Activation statuses: unclaimed -> pending_admin -> approved -> claimed.
 * Once claimed, name + national ID can NEVER be used as login credentials.
 */
const T2_MEMBER_ACTIVATION_={
  UNCLAIMED:"unclaimed",PENDING:"pending_admin",APPROVED:"approved",CLAIMED:"claimed"
};
function t2MemberActivationDecision_(actor,member,activation){
 if(!actor||!member||!activation)return {ok:false,error:"INVALID_REQUEST"};
 if(!["owner","admin"].includes(String(actor.role)))return {ok:false,error:"FORBIDDEN"};
 if(String(member.status)!=="active")return {ok:false,error:"MEMBER_INACTIVE"};
 if(String(actor.role)==="admin"&&
   (!String(actor.room_id||"")||String(actor.room_id)!==String(member.room_id)))
  return {ok:false,error:"ROOM_NOT_ACCESSIBLE"};
 if(String(activation.member_id)!==String(member.member_id))
  return {ok:false,error:"MEMBER_MISMATCH"};
 if(String(activation.status)!==T2_MEMBER_ACTIVATION_.PENDING)
  return {ok:false,error:"NOT_PENDING"};
 if(String(activation.approved_by||""))return {ok:false,error:"ALREADY_APPROVED"};
 return {ok:true,next_status:T2_MEMBER_ACTIVATION_.APPROVED};
}
function t2MemberClaimPolicy_(member,activation,existingUser){
 if(!member||!activation)return {ok:false,error:"INVALID_REQUEST"};
 if(String(member.status)!=="active")return {ok:false,error:"MEMBER_INACTIVE"};
 if(String(activation.member_id)!==String(member.member_id))
  return {ok:false,error:"MEMBER_MISMATCH"};
 if(String(activation.status)!==T2_MEMBER_ACTIVATION_.APPROVED)
  return {ok:false,error:"NOT_APPROVED"};
 if(existingUser)return {ok:false,error:"ACCOUNT_ALREADY_CLAIMED"};
 return {ok:true,next_status:T2_MEMBER_ACTIVATION_.CLAIMED};
}
function t2MemberActivationPolicyTest(){
 const member={member_id:"M1",room_id:"A",status:"active"};
 const pending={member_id:"M1",status:"pending_admin",approved_by:""};
 const approved={member_id:"M1",status:"approved"};
 const checks=[
  ["same_room_admin",t2MemberActivationDecision_({role:"admin",room_id:"A"},member,pending).ok],
  ["other_room_blocked",!t2MemberActivationDecision_({role:"admin",room_id:"B"},member,pending).ok],
  ["unassigned_admin_blocked",!t2MemberActivationDecision_({role:"admin"},member,pending).ok],
  ["member_cannot_approve",!t2MemberActivationDecision_({role:"member"},member,pending).ok],
  ["no_double_approval",!t2MemberActivationDecision_({role:"owner"},member,approved).ok],
  ["approved_claim",t2MemberClaimPolicy_(member,approved,null).ok],
  ["no_claim_before_approval",!t2MemberClaimPolicy_(member,pending,null).ok],
  ["no_double_claim",!t2MemberClaimPolicy_(member,approved,{user_id:"U1"}).ok],
  ["claimed_cannot_reclaim",!t2MemberClaimPolicy_(member,{member_id:"M1",status:"claimed"},null).ok]
 ];
 const report={ok:checks.every(c=>c[1]),results:checks.map(c=>({name:c[0],passed:c[1]}))};
 if(!report.ok)throw Error("Member activation policy failed");
 return report;
}
