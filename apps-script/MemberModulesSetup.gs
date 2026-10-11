/** Run once after adding all member modules to the Apps Script project. */
function t2InstallMemberModules(){
 const results=[];
 results.push(t2InstallMemberProfileExtra());
 results.push(t2InstallMemberContacts());
 results.push(t2InstallMemberPhotos());
 results.push(t2InstallMemberBankRequests());
 return {ok:true,modules:results};
}
/** Read-only configuration check. Does not expose private folder identifiers. */
function t2MemberModulesStatus(){
 const db=t2Db_();
 const names=["MemberProfileExtra","MemberEmergencyContacts","MemberBeneficiaries","MemberPhotos","MemberBankRequests"];
 const sheets=names.map(name=>({name:name,ready:!!db.getSheetByName(name)}));
 const photoFolderConfigured=!!PropertiesService.getScriptProperties().getProperty("T2_MEMBER_PHOTO_FOLDER_ID");
 return {ok:true,sheets:sheets,photo_folder_configured:photoFolderConfigured};
}
