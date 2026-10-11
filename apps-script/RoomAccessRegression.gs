/** Authorization boundary regression for T2PROJECT rooms.
 * Pure tests: no Sheets reads, no sessions, no real member data.
 */
function t2RoomAccessRegressionTest(){
 const member={member_id:"M1",room_id:"A",status:"active"};
 const cases=[
  ["owner_all",t2CanReadMember_({role:"owner"},member)],
  ["admin_own",t2CanReadMember_({role:"admin",room_id:"A"},member)],
  ["admin_other",!t2CanReadMember_({role:"admin",room_id:"B"},member)],
  ["member_self",t2CanReadMember_({role:"member",member_id:"M1"},member)],
  ["member_other",!t2CanReadMember_({role:"member",member_id:"M2"},member)],
  ["inactive",!t2CanReadMember_({role:"owner"},{member_id:"M1",room_id:"A",status:"inactive"})],
  ["unknown_role",!t2CanReadMember_({role:"guest"},member)],
  ["missing_actor",!t2CanReadMember_(null,member)]
 ];
 const result={ok:cases.every(c=>c[1]),checks:cases.map(c=>({name:c[0],ok:c[1]}))};
 if(!result.ok)throw Error("Room access regression failed");
 console.log(JSON.stringify(result));
 return result;
}
