/**
 * T2PROJECT — administrator approval policy (development-only).
 * Approval authorizes enrollment; it is not proof of identity and does not
 * automatically create a login session. Public API remains closed.
 */
function t2ApprovalPolicy_(actor,request){
 if(!actor||!request)return {ok:false,error:"INVALID_REQUEST"};
 const role=String(actor.role||"");
 const requestedRole=String(request.requested_role||"");
 const requestedRoom=String(request.room_id||"");
 if(!["owner","admin"].includes(role))return {ok:false,error:"FORBIDDEN"};
 if(!["member","admin"].includes(requestedRole))return {ok:false,error:"INVALID_ROLE"};
 if(requestedRole==="admin"&&role!=="owner")return {ok:false,error:"OWNER_REQUIRED"};
 if(role==="admin"&&(!String(actor.room_id||"")||requestedRoom!==String(actor.room_id)))
  return {ok:false,error:"ROOM_NOT_ACCESSIBLE"};
 if(!String(request.request_id||"").trim())return {ok:false,error:"INVALID_REQUEST_ID"};
 if(String(request.status)!=="pending")return {ok:false,error:"NOT_PENDING"};
 if(String(request.requester_user_id||"")===String(actor.user_id||""))
  return {ok:false,error:"SELF_APPROVAL_FORBIDDEN"};
 return {ok:true};
}
function t2ApprovalPolicyTest(){
 const owner={role:"owner",user_id:"O1"};
 const admin={role:"admin",room_id:"A",user_id:"A1"};
 const memberRequest={request_id:"R1",requested_role:"member",room_id:"A",status:"pending",requester_user_id:"U1"};
 const checks=[
  ["admin_same_room",t2ApprovalPolicy_(admin,memberRequest).ok===true],
  ["admin_other_room",t2ApprovalPolicy_(admin,Object.assign({},memberRequest,{room_id:"B"})).ok===false],
  ["admin_without_room",t2ApprovalPolicy_({role:"admin",user_id:"A2"},memberRequest).ok===false],
  ["owner_admin_approval",t2ApprovalPolicy_(owner,Object.assign({},memberRequest,{requested_role:"admin"})).ok===true],
  ["admin_cannot_approve_admin",t2ApprovalPolicy_(admin,Object.assign({},memberRequest,{requested_role:"admin"})).ok===false],
  ["cannot_self_approve",t2ApprovalPolicy_(admin,Object.assign({},memberRequest,{requester_user_id:"A1"})).ok===false],
  ["cannot_reapprove",t2ApprovalPolicy_(owner,Object.assign({},memberRequest,{status:"approved"})).ok===false],
  ["member_cannot_approve",t2ApprovalPolicy_({role:"member",user_id:"U2"},memberRequest).ok===false]
 ];
 const report={ok:checks.every(c=>c[1]),results:checks.map(c=>({name:c[0],passed:c[1]}))};
 if(!report.ok)throw Error("Approval policy test failed");
 return report;
}
