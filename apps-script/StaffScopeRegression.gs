/** Pure regression of staff visibility; no database access. */
function t2StaffScopePolicyTest(){
 const rows=[
  {member_id:"M1",room_id:"A",status:"active"},
  {member_id:"M2",room_id:"B",status:"active"},
  {member_id:"M3",room_id:"A",status:"inactive"}
 ];
 const adminA={role:"admin",room_id:"A"},adminB={role:"admin",room_id:"B"};
 const owner={role:"owner"};
 const visible=a=>rows.filter(m=>t2CanReadMember_(a,m)).map(m=>m.member_id).join(",");
 const checks=[
  visible(adminA)==="M1",
  visible(adminB)==="M2",
  visible(owner)==="M1,M2",
  visible({role:"admin"})==="",
  visible({role:"member",member_id:"M1"})==="M1"
 ];
 if(!checks.every(Boolean))throw Error("Staff scope regression failed");
 return {ok:true,checks:checks.length};
}
