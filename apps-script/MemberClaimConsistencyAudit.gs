/** Read-only audit of member activation consistency. No personal data in output. */
function t2MemberClaimConsistencyAudit(){
 const members=t2Rows_("Members"),requests=t2Rows_("MemberActivations");
 const tickets=t2Rows_("ActivationTickets");
 const accounts=t2Rows_("Users").filter(x=>x.role==="member");
 const counts={duplicateAccounts:0,orphanAccounts:0,incompleteClaims:0};
 const known=new Set(members.map(x=>String(x.member_id)));
 const byMember=new Map();
 for(const account of accounts){
  const id=String(account.member_id||"");
  byMember.set(id,(byMember.get(id)||0)+1);
  if(!known.has(id))counts.orphanAccounts++;
 }
 for(const n of byMember.values())if(n>1)counts.duplicateAccounts++;
 for(const request of requests){
  if(byMember.has(String(request.member_id))&&request.status!=="claimed")
   counts.incompleteClaims++;
 }
 const ok=Object.values(counts).every(x=>x===0);
 const result={ok,issues:counts,totals:{members:members.length,requests:requests.length,tickets:tickets.length,accounts:accounts.length}};
 console.log(JSON.stringify(result));
 return result;
}
