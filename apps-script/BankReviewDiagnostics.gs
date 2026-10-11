/** Read-only bank review integrity diagnostics; run manually before production release. */
function t2CheckBankReviewIntegrity(){
 const db=t2Db_(),requests=db.getSheetByName("MemberBankRequests"),audit=db.getSheetByName("MemberBankAudit");
 if(!requests||!audit)return {ok:false,error:"MISSING_SHEETS"};
 const r=requests.getDataRange().getValues(),a=audit.getDataRange().getValues();
 const rh=r[0].map(String),ah=a[0].map(String);
 const id=rh.indexOf("request_id"),status=rh.indexOf("status"),aid=ah.indexOf("request_id"),decision=ah.indexOf("decision");
 if([id,status,aid,decision].some(i=>i<0))return {ok:false,error:"INVALID_SCHEMA"};
 const byId=new Map(),issues=[];
 for(let i=1;i<a.length;i++){
  const key=String(a[i][aid]),value=String(a[i][decision]);
  if(byId.has(key))issues.push({row:i+1,type:"DUPLICATE_AUDIT",request_id:key});
  else byId.set(key,value);
 }
 for(let i=1;i<r.length;i++){
  const key=String(r[i][id]),value=String(r[i][status]),logged=byId.get(key);
  if(logged&&logged!==value)issues.push({row:i+1,type:"STATUS_AUDIT_MISMATCH",request_id:key});
  if(!logged&&value!=="pending")issues.push({row:i+1,type:"MISSING_AUDIT",request_id:key});
 }
 return {ok:issues.length===0,request_count:r.length-1,audit_count:a.length-1,issues:issues.slice(0,100)};
}
