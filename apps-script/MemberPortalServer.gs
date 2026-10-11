/**
 * Same-origin Apps Script member portal.
 * Feature-gated: enable only after synthetic end-to-end security testing.
 * Credentials are handled by google.script.run, never URL query strings.
 */
function t2MemberPortalEnabled_(){
 return PropertiesService.getScriptProperties().getProperty("T2_MEMBER_PORTAL_ENABLED")==="true";
}
function t2MemberPortalPage_(){
 if(!t2MemberPortalEnabled_())return t2Json_({ok:false,error:"PORTAL_DISABLED"});
 return HtmlService.createHtmlOutputFromFile("MemberPortal")
  .setTitle("T2PROJECT | สมาชิก");
}
function t2PortalLogin(username,password){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 if(typeof t2MemberLogin!=="function")return {ok:false,error:"MEMBER_AUTH_NOT_CONFIGURED"};
 return t2MemberLogin(username,password);
}
function t2PortalMe(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===String(actor.member_id)&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_AVAILABLE_OR_AMBIGUOUS"};
 const member=matches[0];
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const slips=t2Rows_("Slips").filter(s=>String(s.member_id)===String(actor.member_id)&&
  String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 return {ok:true,profile:{
  full_name:String(member.full_name||""),room_id:String(member.room_id||""),
  phone:String(member.phone||""),email:String(member.email||"")
 },summary:{slip_count:slips.length,amount_total:slips.reduce((n,s)=>n+(Number(s.amount)||0),0),bank_verified:false}};
}
function t2PortalLogout(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 return logout(token);
}

// Member slip pagination is planned after data consistency verification.

function t2PortalSlipPage(token,page){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===String(actor.member_id)&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_AVAILABLE_OR_AMBIGUOUS"};
 const member=matches[0];
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const n=Number(page);
 if(!Number.isInteger(n)||n<1||n>100000)return {ok:false,error:"INVALID_PAGE"};
 const all=t2Rows_("Slips").filter(s=>String(s.member_id)===String(actor.member_id)&&String(s.room_id)===String(member.room_id)&&String(s.status)!=="deleted");
 all.sort((a,b)=>new Date(b.transfer_at).getTime()-new Date(a.transfer_at).getTime());
 const items=all.slice((n-1)*20,n*20).map(s=>({
  date:s.transfer_at instanceof Date?Utilities.formatDate(s.transfer_at,Session.getScriptTimeZone(),"dd/MM/yyyy HH:mm"):String(s.transfer_at||""),
  amount:Number(s.amount)||0,
  ref:String(s.reference_last6||""),
  sender:String(s.sender||""),
  receiver:String(s.receiver||"")
 }));
 return {ok:true,page:n,total:all.length,items:items};
}

/** One-time additive setup. Does not alter existing member rows. */
function t2InstallMemberProfileExtra(){
 const db=t2Db_();
 let sheet=db.getSheetByName("MemberProfileExtra");
 if(!sheet){sheet=db.insertSheet("MemberProfileExtra");sheet.appendRow(["member_id","address","map_url","updated_at"])}
 return "MemberProfileExtra ready";
}
function t2PortalProfileExtra(token){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===String(actor.member_id)&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_AVAILABLE_OR_AMBIGUOUS"};
 const member=matches[0];
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 const sheet=t2Db_().getSheetByName("MemberProfileExtra");
 if(!sheet)return {ok:true,address:"",map_url:"",setup_required:true};
 const row=t2Rows_("MemberProfileExtra").find(x=>String(x.member_id)===String(actor.member_id));
 return {ok:true,address:String(row&&row.address||""),map_url:String(row&&row.map_url||"")};
}
function t2PortalSaveProfileExtra(token,address,mapUrl){
 if(!t2MemberPortalEnabled_())return {ok:false,error:"PORTAL_DISABLED"};
 const actor=t2RequireRole_(token,["member"]);
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===String(actor.member_id)&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_AVAILABLE_OR_AMBIGUOUS"};
 const member=matches[0];
 if(!t2CanReadMember_(actor,member))return {ok:false,error:"FORBIDDEN"};
 if(typeof address!=="string"||address.length>1000||typeof mapUrl!=="string"||mapUrl.length>500)return {ok:false,error:"INVALID_INPUT"};
 const url=mapUrl.trim();
 if(url&&(!/^https:\/\/www\.google\.com\/maps\//.test(url)&&!/^https:\/\/maps\.app\.goo\.gl\//.test(url)))return {ok:false,error:"INVALID_MAP_URL"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const sheet=t2Db_().getSheetByName("MemberProfileExtra");
  if(!sheet)return {ok:false,error:"PROFILE_SETUP_REQUIRED"};
  const values=sheet.getDataRange().getValues();
  const index=values.findIndex((r,i)=>i>0&&String(r[0])===String(actor.member_id));
  const data=[String(actor.member_id),address.trim(),url,new Date()];
  if(index<0)sheet.appendRow(data);else sheet.getRange(index+1,1,1,4).setValues([data]);
  return {ok:true};
 }finally{lock.releaseLock()}
}


function t2InstallMemberContacts(){
 const db=t2Db_();
 const specs={MemberEmergencyContacts:["member_id","slot","full_name","phone","relationship"],MemberBeneficiaries:["member_id","slot","full_name","phone","id_number","percent"]};
 Object.keys(specs).forEach(name=>{if(!db.getSheetByName(name)){const sh=db.insertSheet(name);sh.appendRow(specs[name])}});
 return "Member contacts sheets ready";
}
function t2PortalContactsActor_(token){
 if(!t2MemberPortalEnabled_())throw Error("PORTAL_DISABLED");
 const actor=t2RequireRole_(token,["member"]);
 const matches=t2Rows_("Members").filter(m=>String(m.member_id)===String(actor.member_id)&&String(m.status)==="active");
 if(matches.length!==1)return {ok:false,error:"MEMBER_NOT_AVAILABLE_OR_AMBIGUOUS"};
 const member=matches[0];
 if(!t2CanReadMember_(actor,member))throw Error("FORBIDDEN");
 return actor;
}
function t2PortalGetContacts(token){
 const actor=t2PortalContactsActor_(token);
 const db=t2Db_();
 const emergency=db.getSheetByName("MemberEmergencyContacts")?t2Rows_("MemberEmergencyContacts").filter(x=>String(x.member_id)===String(actor.member_id)).map(x=>({full_name:String(x.full_name||""),phone:String(x.phone||""),relationship:String(x.relationship||"")})):[];
 const beneficiaries=db.getSheetByName("MemberBeneficiaries")?t2Rows_("MemberBeneficiaries").filter(x=>String(x.member_id)===String(actor.member_id)).map(x=>({full_name:String(x.full_name||""),phone:String(x.phone||""),id_number:String(x.id_number||""),percent:Number(x.percent)||0})):[];
 return {ok:true,emergency:emergency,beneficiaries:beneficiaries};
}
function t2PortalSaveContacts(token,emergency,beneficiaries){
 const actor=t2PortalContactsActor_(token);
 if(!Array.isArray(emergency)||emergency.length<2||emergency.length>10||!Array.isArray(beneficiaries)||beneficiaries.length<1||beneficiaries.length>30)return {ok:false,error:"INVALID_COUNT"};
 const clean=(value,max)=>{if(typeof value!=="string"||value.length>max)throw Error("INVALID_INPUT");const result=value.trim();if(/^[=+@]/.test(result))throw Error("INVALID_INPUT");return result};
 const e=emergency.map(x=>({full_name:clean(x.full_name,120),phone:clean(x.phone,30),relationship:clean(x.relationship,80)}));
 const b=beneficiaries.map(x=>({full_name:clean(x.full_name,120),phone:clean(x.phone,30),id_number:clean(x.id_number,30),percent:Number(x.percent)}));
 if(e.some(x=>!x.full_name||!x.phone)||b.some(x=>!x.full_name||!x.phone||!Number.isFinite(x.percent)||x.percent<=0||x.percent>100))return {ok:false,error:"INVALID_INPUT"};
 if(Math.abs(b.reduce((n,x)=>n+x.percent,0)-100)>0.001)return {ok:false,error:"PERCENT_NOT_100"};
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const db=t2Db_();
  const specs=[["MemberEmergencyContacts",e,x=>[actor.member_id,x.slot,x.full_name,x.phone,x.relationship]],["MemberBeneficiaries",b,x=>[actor.member_id,x.slot,x.full_name,x.phone,x.id_number,x.percent]]];
  if(specs.some(x=>!db.getSheetByName(x[0])))return {ok:false,error:"CONTACT_SETUP_REQUIRED"};
  for(const [name,records,serialize] of specs){
   const sh=db.getSheetByName(name),values=sh.getDataRange().getValues();
   const rows=records.map((x,i)=>serialize(Object.assign({slot:i+1},x)));
   if(rows.length)sh.getRange(sh.getLastRow()+1,1,rows.length,rows[0].length).setValues(rows);
   for(let i=values.length-1;i>=1;i--)if(String(values[i][0])===String(actor.member_id))sh.deleteRow(i+1);
  }
  return {ok:true};
 }finally{lock.releaseLock()}
}


/** Additive, private member photo storage; setup requires an existing private Drive folder ID. */
function t2PortalPhotoFolder_(){
 const id=PropertiesService.getScriptProperties().getProperty("T2_MEMBER_PHOTO_FOLDER_ID");
 if(!id)throw Error("PHOTO_FOLDER_NOT_CONFIGURED");
 return DriveApp.getFolderById(id);
}
function t2PortalPhotoInfo(token){
 const actor=t2PortalContactsActor_(token);
 const sheet=t2Db_().getSheetByName("MemberPhotos");
 if(!sheet)return {ok:true,has_photo:false,setup_required:true};
 const row=t2Rows_("MemberPhotos").find(x=>String(x.member_id)===String(actor.member_id));
 return {ok:true,has_photo:!!(row&&row.file_id)};
}
function t2InstallMemberPhotos(){
 const db=t2Db_();if(!db.getSheetByName("MemberPhotos"))db.insertSheet("MemberPhotos").appendRow(["member_id","file_id","mime_type","updated_at"]);
 return "MemberPhotos ready";
}
function t2PortalSavePhoto(token,mimeType,base64){
 const actor=t2PortalContactsActor_(token);
 if(!["image/jpeg","image/png","image/webp"].includes(mimeType)||typeof base64!=="string"||base64.length>2800000)return {ok:false,error:"INVALID_PHOTO"};
 const bytes=Utilities.base64Decode(base64);
 if(bytes.length>2000000||bytes.length<12)return {ok:false,error:"PHOTO_TOO_LARGE"};
 const signature=bytes.slice(0,12).map(x=>x&255);
 const jpg=signature[0]===255&&signature[1]===216&&signature[2]===255;
 const png=signature.slice(0,8).join(",")==="137,80,78,71,13,10,26,10";
 const webp=String.fromCharCode.apply(null,signature.slice(0,4))==="RIFF"&&String.fromCharCode.apply(null,signature.slice(8,12))==="WEBP";
 if(!(mimeType==="image/jpeg"&&jpg||mimeType==="image/png"&&png||mimeType==="image/webp"&&webp))return {ok:false,error:"INVALID_IMAGE_FORMAT"};
 const sheet=t2Db_().getSheetByName("MemberPhotos");if(!sheet)return {ok:false,error:"PHOTO_SETUP_REQUIRED"};
 const folder=t2PortalPhotoFolder_();
 const file=folder.createFile(Utilities.newBlob(bytes,mimeType,"member-photo-"+Utilities.getUuid()));
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const rows=sheet.getDataRange().getValues(),index=rows.findIndex((r,i)=>i>0&&String(r[0])===String(actor.member_id));
  const previous=index>=0?String(rows[index][1]||""):"";
  const values=[String(actor.member_id),file.getId(),mimeType,new Date()];
  if(index>=0)sheet.getRange(index+1,1,1,4).setValues([values]);else sheet.appendRow(values);
  if(previous&&previous!==file.getId()){try{DriveApp.getFileById(previous).setTrashed(true)}catch(ignore){}}
  return {ok:true};
 }catch(error){try{file.setTrashed(true)}catch(ignore){}throw error}finally{lock.releaseLock()}
}
function t2PortalReadPhoto(token){
 const actor=t2PortalContactsActor_(token);
 const sheet=t2Db_().getSheetByName("MemberPhotos");if(!sheet)return {ok:false,error:"PHOTO_SETUP_REQUIRED"};
 const row=t2Rows_("MemberPhotos").find(x=>String(x.member_id)===String(actor.member_id));
 if(!row||!row.file_id)return {ok:true,has_photo:false};
 const photoFile=DriveApp.getFileById(String(row.file_id));
 const configuredFolder=t2PortalPhotoFolder_();
 if(!photoFile.getParents().hasNext())return {ok:false,error:"PHOTO_NOT_IN_FOLDER"};
 const parents=photoFile.getParents();let owned=false;
 while(parents.hasNext()){if(parents.next().getId()===configuredFolder.getId()){owned=true;break}}
 if(!owned)return {ok:false,error:"PHOTO_NOT_IN_FOLDER"};
 const blob=photoFile.getBlob();
 if(blob.getBytes().length>2000000)return {ok:false,error:"PHOTO_TOO_LARGE"};
 return {ok:true,has_photo:true,mime_type:String(row.mime_type),base64:Utilities.base64Encode(blob.getBytes())};
}
