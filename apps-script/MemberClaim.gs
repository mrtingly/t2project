/**
 * Atomic one-time member claim, using admin-approved invitation.
 * Editor/server-side only: public doPost remains closed until audited.
 */
function t2ClaimMemberAccount(invite,username,password){
 if(!t2InviteValid_(invite))return {ok:false,error:"INVALID_INVITE"};
 const normalized=t2MemberUsername_(username);
 if(!normalized)return {ok:false,error:"INVALID_USERNAME"};
 const passwordPolicy=t2MemberPasswordPolicy_(password,normalized);
 if(!passwordPolicy.ok)return passwordPolicy;
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(30000))return {ok:false,error:"BUSY"};
 try{
  const sh=t2Sheet_("ActivationTickets");
  const data=sh.getDataRange().getValues();
  const digest=t2InviteDigest_(invite);
  let index=-1;
  for(let i=1;i<data.length;i++)
   if(String(data[i][1])===digest){index=i;break}
  if(index<1)return {ok:false,error:"INVALID_INVITE"};
  const ticket={request_id:data[index][0],expires_at:data[index][2],consumed_at:data[index][3]};
  const activation=t2ActivationRows_().find(a=>String(a.request_id)===String(ticket.request_id));
  if(!t2InviteEligible_(activation,ticket,Date.now()))return {ok:false,error:"INVITE_EXPIRED_OR_USED"};
  const member=t2ActivationMember_(activation.member_id);
  const users=t2Rows_("Users");
  const policy=t2MemberAccountPolicy_(normalized,password,users,member,activation);
  if(!policy.ok)return policy;
  if(!/^M[A-F0-9]{16}$/.test(String(member.member_id))||!String(member.room_id||""))
   return {ok:false,error:"INVALID_MEMBER_RECORD"};
  const credential=t2PasswordCreate_(password);
  const userId=Utilities.getUuid();
  // Claim marker is set before account creation; retry is blocked if an append fails.
  // Operator reconciliation is required for partial write failures.
  sh.getRange(index+1,4).setValue(new Date());
  t2Sheet_("Users").appendRow([userId,normalized,"member",String(member.room_id),
   String(member.member_id),credential.salt,credential.password_hash,"active",new Date()]);
  const activationSheet=t2Sheet_("MemberActivations");
  const activationData=activationSheet.getDataRange().getValues();
  for(let i=1;i<activationData.length;i++){
   if(String(activationData[i][0])===String(activation.request_id)){
    activationSheet.getRange(i+1,3).setValue("claimed");
    activationSheet.getRange(i+1,7).setValue(new Date());
    break;
   }
  }
  t2Audit_("MEMBER_ACCOUNT_CLAIMED",userId,String(member.member_id));
  return {ok:true,status:"claimed",username:normalized};
 }finally{lock.releaseLock()}
}
