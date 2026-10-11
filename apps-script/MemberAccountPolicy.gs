/**
 * Member account enrollment validation.
 * Does not persist passwords or issue sessions.
 */
function t2MemberUsername_(input){
 const value=String(input||"").trim().toLowerCase();
 return /^[a-z][a-z0-9._-]{5,31}$/.test(value)?value:null;
}
function t2MemberPasswordPolicy_(input,username){
 if(typeof input!=="string"||input.length<12||input.length>128)return {ok:false,error:"PASSWORD_LENGTH"};
 if(!/[A-Z]/.test(input)||!/[a-z]/.test(input)||!/[0-9]/.test(input))
  return {ok:false,error:"PASSWORD_COMPLEXITY"};
 if(/\s/.test(input))return {ok:false,error:"PASSWORD_WHITESPACE"};
 if(username&&input.toLowerCase().includes(String(username).toLowerCase()))
  return {ok:false,error:"PASSWORD_CONTAINS_USERNAME"};
 if(/(.)\1{5,}/.test(input))return {ok:false,error:"PASSWORD_REPETITION"};
 return {ok:true};
}
function t2MemberAccountPolicy_(username,password,existingUsers,member,activation){
 const normalized=t2MemberUsername_(username);
 if(!normalized)return {ok:false,error:"INVALID_USERNAME"};
 const passwordCheck=t2MemberPasswordPolicy_(password,normalized);
 if(!passwordCheck.ok)return passwordCheck;
 if((existingUsers||[]).some(u=>String(u.username||"").trim().toLowerCase()===normalized))
  return {ok:false,error:"USERNAME_TAKEN"};
 if((existingUsers||[]).some(u=>String(u.member_id||"")===String(member&&member.member_id)))
  return {ok:false,error:"ACCOUNT_ALREADY_CLAIMED"};
 const claim=t2MemberClaimPolicy_(member,activation,null);
 if(!claim.ok)return claim;
 return {ok:true,username:normalized};
}
function t2MemberAccountPolicyTest(){
 const member={member_id:"M1",status:"active"};
 const activation={member_id:"M1",status:"approved"};
 const good="LongSecure9Password";
 const cases=[
  ["valid",t2MemberAccountPolicy_("member001",good,[],member,activation).ok],
  ["short_username",!t2MemberAccountPolicy_("abc",good,[],member,activation).ok],
  ["duplicate_username",!t2MemberAccountPolicy_("member001",good,[{username:"MEMBER001",member_id:"M2"}],member,activation).ok],
  ["duplicate_member",!t2MemberAccountPolicy_("member001",good,[{username:"otheruser",member_id:"M1"}],member,activation).ok],
  ["short_password",!t2MemberAccountPolicy_("member001","abc",[],member,activation).ok],
  ["no_uppercase",!t2MemberAccountPolicy_("member001","lowercase123456",[],member,activation).ok],
  ["already_claimed",!t2MemberAccountPolicy_("member001",good,[],member,{member_id:"M1",status:"claimed"}).ok]
 ];
 const report={ok:cases.every(c=>c[1]),cases:cases.map(c=>({name:c[0],passed:c[1]}))};
 if(!report.ok)throw Error("Member account policy regression failed");
 return report;
}
