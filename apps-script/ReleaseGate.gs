/**
 * Read-only release gate. Run from the Apps Script editor before publishing a production deployment.
 * Never returns credentials, member records or session tokens.
 */
function t2ReleaseGate(){
 const checks=[];
 function add(name,pass,detail){checks.push({name:name,pass:!!pass,detail:String(detail||"")})}
 try{
  const base=t2Preflight();
  add("database_and_core_sheets",base.databaseConfigured&&base.requiredTables,base.databaseConfigured&&base.requiredTables?"Ready":"Database or schema incomplete");
 }catch(e){add("database_and_core_sheets",false,"Database unavailable")}
 try{
  const auth=t2AuthPreflight();
  add("authentication_schema",!!auth.ok,auth.ok?"Schema checked":"Authentication requires review");
 }catch(e){add("authentication_schema",false,"Auth check unavailable")}
 try{const owner=t2OwnerReleasePreflight();add("member_and_bank_schemas",owner.ok,owner.ok?"Required columns present":"Missing required columns")}catch(e){add("member_and_bank_schemas",false,"Owner preflight unavailable")}
 add("member_login_implementation",typeof t2MemberLogin==="function","Implementation existence only; security review still required");
 add("member_login_review",false,"Member identity and session issuance require independent security review");
 add("owner_admin_login",false,"Legacy login deliberately disabled; identity provider not integrated");
 add("admin_dashboard_route",false,"Admin preview not yet routed behind authenticated login");
 add("owner_dashboard_route",false,"Owner preview not yet routed behind authenticated login");
 add("promotion_calculation",false,"Verified promotion schedules and calculations not integrated");
 add("end_to_end_test",false,"Must be performed with synthetic users and receipts");
 const blocking=checks.filter(c=>!c.pass).map(c=>c.name);
 return {ok:blocking.length===0,production_ready:false,checks:checks,blocking:blocking};
}
