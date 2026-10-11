/** Manual, read-only release preflight. Run in Apps Script editor only. */
function t2OwnerReleasePreflight(){
 const db=t2Db_();
 const required={
  Members:["member_id","full_name","room_id","status"],
  Slips:["slip_id","member_id","room_id","transfer_at","amount","reference_last6","sender","receiver","status"],
  Users:["user_id","role","status"],
  Sessions:["token_hash","user_id","expires_at","revoked_at"],
  MemberBankRequests:["request_id","member_id","bank_name","account_last4","account_holder","status","requested_at"],
  MemberBankAudit:["reviewed_at","request_id","member_id","decision","reviewer_id"]
 };
 const tables=Object.keys(required).map(name=>{
  const sh=db.getSheetByName(name);
  if(!sh)return {name:name,ready:false,missing:required[name]};
  const headers=sh.getLastRow()?sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String):[];
  const missing=required[name].filter(col=>!headers.includes(col));
  return {name:name,ready:missing.length===0,missing:missing};
 });
 const issues=tables.filter(x=>!x.ready).map(x=>x.name+": "+x.missing.join(", "));
 const properties=PropertiesService.getScriptProperties();
 const memberPortalEnabled=properties.getProperty("T2_MEMBER_PORTAL_ENABLED")==="true";
 return {ok:issues.length===0,checks:tables,member_portal_enabled:memberPortalEnabled,owner_ui_production_ready:false,
  notes:["Owner HTML prototypes are not routed by doGet.","Legacy login() is disabled; reviewed authentication is required.","No real account change is applied by bank review."],issues:issues};
}
