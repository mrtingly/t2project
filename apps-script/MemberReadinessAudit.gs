/**
 * Read-only deployment readiness audit.
 * Returns counts only, never member names, national IDs, usernames, or tokens.
 * Run manually in the trusted Apps Script editor.
 */
function t2MemberReadinessAudit(){
 const db=t2Db_();
 const specs={
  Users:["user_id","username","role","room_id","member_id","salt","password_hash","status","created_at"],
  Sessions:["token_hash","user_id","expires_at","revoked_at"],
  Members:["member_id","full_name","id_number","room_id","phone","email","status","created_at"],
  MemberActivations:["request_id","member_id","status","requested_at","approved_by","approved_at","claimed_at"],
  ActivationTickets:["request_id","ticket_hash","expires_at","consumed_at","issued_by"]
 };
 const tables={};
 for(const name of Object.keys(specs)){
  const sh=db.getSheetByName(name);
  if(!sh){tables[name]={ok:false,error:"MISSING_TABLE"};continue}
  const cols=sh.getLastColumn();
  const headers=cols?sh.getRange(1,1,1,cols).getValues()[0].map(String):[];
  tables[name]={ok:headers.join("|")===specs[name].join("|"),rows:Math.max(0,sh.getLastRow()-1)};
 }
 const ok=Object.keys(tables).every(k=>tables[k].ok);
 const report={ok,tables,authHttpEnabled:false,checked_at:new Date().toISOString()};
 console.log(JSON.stringify(report));
 return report;
}
