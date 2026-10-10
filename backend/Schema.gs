/**
 * T2PROJECT V3 — Google Apps Script setup.
 * Run initializeV3() manually in a NEW spreadsheet-bound Apps Script project.
 * Run only on a fresh empty spreadsheet. This creates HEADERS, not real member data.
 * Do NOT publish an anonymous web app or store secrets in this file.
 */
const V3_TABLES = Object.freeze({
 Rooms:["room_id","room_name","admin_user_id"],
 Users:["user_id","role","room_id","member_id","username","password_hash","password_salt","status","created_at"],
 Members:["member_id","room_id","first_name","last_name","national_id_encrypted","phone","email","address","map_location","bank_details","id_image_drive_id","created_by","status"],
 EmergencyContacts:["contact_id","member_id","name","phone","relationship"],
 Beneficiaries:["beneficiary_id","member_id","name","national_id_encrypted","phone","percentage"],
 Slips:["slip_id","room_id","payment_channel","original_payer_name","bank","paid_at","amount","reference","counter_service_receipt_number","terminal_or_branch","receiver","original_drive_id","fingerprint","created_by","status","verified_bank_entry_id","created_at"],
 SlipAllocations:["allocation_id","slip_id","beneficiary_member_id","payer_member_id","allocation_type","amount","rights_count","period_yyyy_mm","note"],
 Programs:["program_id","effective_from","effective_to","source_reference","amount_basis","claimed_monetary_outcome","fallback_flag","terms"],
 MemberProgramResults:["result_id","allocation_id","program_id","program_contribution","admin_fee","claimed_result","calculation_status"],
 HardshipReports:["report_id","member_id","room_id","period_yyyy_mm","reason","details","acknowledged_at","status"],
 Statements:["statement_id","bank","statement_account","date_from","date_to","imported_by","source_drive_id","imported_at"],
 BankEntries:["entry_id","statement_id","booked_at","amount","direction","reference","counterpart","fingerprint","matched_slip_id","status"],
 AuditLog:["audit_id","actor_id","action","object_type","object_id","before_json","after_json","at"]
});
function initializeV3() {
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 if(!ss) throw new Error("Open a NEW spreadsheet-bound Apps Script project");
 const existing=ss.getSheets().filter(s=>s.getLastRow()>0);
 if(existing.length) throw new Error("Refusing to initialize a non-empty spreadsheet");
 const defaultSheet=ss.getSheets()[0];
 Object.entries(V3_TABLES).forEach(([name,columns])=>{
   const sheet=ss.getSheetByName(name)||ss.insertSheet(name);
   sheet.getRange(1,1,1,columns.length).setValues([columns]);
   sheet.setFrozenRows(1);
   sheet.getRange(1,1,1,columns.length).setFontWeight("bold");
 });
 const rooms=["A+","A","B","C","D","E","F","G"];
 const sheet=ss.getSheetByName("Rooms");
 sheet.getRange(2,1,rooms.length,3).setValues(rooms.map((name,i)=>["R"+String(i+1).padStart(3,"0"),name,""]));
 if(defaultSheet.getName()==="Sheet1" && defaultSheet.getLastRow()===0 && ss.getSheets().length>1) ss.deleteSheet(defaultSheet);
 return "V3 tables initialized; NO users or credentials have been created.";
}
