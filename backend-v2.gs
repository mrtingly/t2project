/* T2Project Backend V2 - Phase 1 (Owner/Admin/Master Member)
   Add this file to the existing Apps Script project and route the actions listed below from doPost.
   Uses SYSTEM_SPREADSHEET_ID from the existing backend.
*/
const ADMINS_SHEET='Admins';
const MEMBERS_SHEET='Members';

function v2GetSheet_(name){
  const ss=SpreadsheetApp.openById(SYSTEM_SPREADSHEET_ID);
  const sh=ss.getSheetByName(name);
  if(!sh) throw new Error(name+' sheet not found');
  return sh;
}
function v2Rows_(name){
  const sh=v2GetSheet_(name),v=sh.getDataRange().getDisplayValues();
  if(!v.length)return {sheet:sh,headers:[],rows:[]};
  const headers=v[0].map(String);
  return {sheet:sh,headers:headers,rows:v.slice(1)};
}
function v2Obj_(headers,row){const o={};headers.forEach((h,i)=>o[h]=row[i]||'');return o}
function v2NormName_(v){return String(v||'').trim().replace(/^(นาย|นางสาว|นาง|น\.ส\.|น\.ส)\s*/,'').replace(/\s+/g,' ').toLowerCase()}
function v2AdminByUsername_(username){
  const d=v2Rows_(ADMINS_SHEET),u=String(username||'').trim();
  for(const r of d.rows){const x=v2Obj_(d.headers,r);if(x.username===u)return x}return null;
}
function v2RequireAdmin_(token){
  const s=requireStaff(token); if(!s)return null;
  if(s.role==='owner')return {session:s,admin:null};
  const a=v2AdminByUsername_(s.username);
  if(!a||a.status!=='active')return null;
  return {session:s,admin:a};
}
function getAdmins(req){
  if(!requireOwner(req.token))return {ok:false,auth:false,message:'Unauthorized'};
  const d=v2Rows_(ADMINS_SHEET);
  return {ok:true,admins:d.rows.filter(r=>r.some(Boolean)).map(r=>v2Obj_(d.headers,r))};
}
function getMyMembers(req){
  const auth=v2RequireAdmin_(req.token);if(!auth)return {ok:false,auth:false,message:'Unauthorized'};
  const d=v2Rows_(MEMBERS_SHEET),isOwner=auth.session.role==='owner',aid=auth.admin&&auth.admin.admin_id;
  const items=[];
  for(const r of d.rows){if(!r.some(Boolean))continue;const x=v2Obj_(d.headers,r);if(!isOwner&&x.admin_id!==aid)continue;items.push({memberId:x.member_id,firstName:x.first_name,lastName:x.last_name,citizenId:x.citizen_id,documentId:x.citizen_id,status:x.status,adminId:x.admin_id,adminUsername:x.admin_username})}
  return {ok:true,members:items,items:items};
}
function searchMembers(req){
  const auth=v2RequireAdmin_(req.token);if(!auth)return {ok:false,auth:false,message:'Unauthorized'};
  const q=v2NormName_((req.firstName||'')+' '+(req.lastName||'')),id=String(req.citizenId||req.documentId||'').replace(/[\s-]/g,'');
  const d=v2Rows_(MEMBERS_SHEET),admins=v2Rows_(ADMINS_SHEET),names={};
  admins.rows.forEach(r=>{const a=v2Obj_(admins.headers,r);names[a.admin_id]=a.display_name||a.username});
  const items=[];
  for(const r of d.rows){if(!r.some(Boolean))continue;const x=v2Obj_(d.headers,r),nm=v2NormName_(x.first_name+' '+x.last_name),cid=String(x.citizen_id||'').replace(/[\s-]/g,'');if((q&&nm.indexOf(q)<0)&&(!id||cid!==id))continue;items.push({memberId:x.member_id,firstName:x.first_name,lastName:x.last_name,citizenId:x.citizen_id,documentId:x.citizen_id,status:x.status,adminId:x.admin_id,adminUsername:x.admin_username,adminName:names[x.admin_id]||x.admin_username});if(items.length>=8)break}
  return {ok:true,members:items,items:items};
}
function findMemberV2(req){
  const r=searchMembers(req);if(!r.ok)return r;
  const exactName=v2NormName_((req.firstName||'')+' '+(req.lastName||'')||req.fullName),id=String(req.citizenId||req.documentId||'').replace(/[\s-]/g,'');
  let x=r.items.find(m=>(!exactName||v2NormName_(m.firstName+' '+m.lastName)===exactName)&&(!id||String(m.citizenId||'').replace(/[\s-]/g,'')===id));
  if(!x&&req.fullName){const fn=v2NormName_(req.fullName);x=r.items.find(m=>v2NormName_(m.firstName+' '+m.lastName)===fn)}
  return x?{ok:true,member:x}:{ok:false,message:'ไม่พบสมาชิก'};
}
function createMember(req){
  const auth=v2RequireAdmin_(req.token);if(!auth||auth.session.role!=='admin')return {ok:false,auth:false,message:'เฉพาะ Admin ที่ Active เท่านั้น'};
  const first=String(req.firstName||'').trim(),last=String(req.lastName||'').trim(),cid=String(req.citizenId||req.documentId||'').replace(/[\s-]/g,'');
  if(!first||!last)return {ok:false,message:'กรุณากรอกชื่อและนามสกุล'};
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const d=v2Rows_(MEMBERS_SHEET),key=v2NormName_(first+' '+last);
    for(const r of d.rows){if(!r.some(Boolean))continue;const x=v2Obj_(d.headers,r);const sameName=v2NormName_(x.first_name+' '+x.last_name)===key,sameId=cid&&String(x.citizen_id||'').replace(/[\s-]/g,'')===cid;if(sameName||sameId){return {ok:false,duplicate:true,message:x.admin_id===auth.admin.admin_id?'สมาชิกนี้อยู่ในรายชื่อของคุณแล้ว':'สมาชิกนี้มีอยู่ใน Master และอยู่ภายใต้ Admin อื่น',member:{memberId:x.member_id,firstName:x.first_name,lastName:x.last_name,adminId:x.admin_id,adminUsername:x.admin_username}}}}
    const memberId='MEM-'+Utilities.getUuid().substring(0,8).toUpperCase(),now=Utilities.formatDate(new Date(),'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm:ss");
    d.sheet.appendRow([first,last,cid,'T2Project','active',memberId,auth.admin.admin_id,auth.admin.username,now,now]);
    return {ok:true,member:{memberId:memberId,firstName:first,lastName:last,citizenId:cid,documentId:cid,adminId:auth.admin.admin_id,adminUsername:auth.admin.username}};
  }finally{lock.releaseLock()}
}
function createAdmin(req){
  if(!requireOwner(req.token))return {ok:false,auth:false,message:'Unauthorized'};
  const username=String(req.username||'').trim(),displayName=String(req.displayName||'').trim();
  if(!username||!displayName)return {ok:false,message:'ข้อมูล Admin ไม่ครบ'};
  const d=v2Rows_(ADMINS_SHEET);for(const r of d.rows){const x=v2Obj_(d.headers,r);if(x.username===username)return {ok:false,message:'Username นี้มีอยู่แล้ว'}}
  const id='ADM-'+Utilities.getUuid().substring(0,8).toUpperCase(),now=new Date().toISOString();d.sheet.appendRow([id,username,displayName,'active','Bigboss',now,now,'','','']);
  return {ok:true,admin:{adminId:id,username:username,displayName:displayName,status:'active'}};
}
function setAdminStatus(req){
  if(!requireOwner(req.token))return {ok:false,auth:false,message:'Unauthorized'};
  const d=v2Rows_(ADMINS_SHEET),id=String(req.adminId||'');for(let i=0;i<d.rows.length;i++){const x=v2Obj_(d.headers,d.rows[i]);if(x.admin_id===id){const status=req.status==='active'?'active':'disabled';d.sheet.getRange(i+2,4).setValue(status);d.sheet.getRange(i+2,7).setValue(new Date().toISOString());return {ok:true,status:status}}}return {ok:false,message:'Admin not found'};
}
/* Add these routes inside existing doPost switch:
case 'getAdmins': return json(getAdmins(req));
case 'getMyMembers': return json(getMyMembers(req));
case 'searchMembers': return json(searchMembers(req));
case 'findMemberV2': return json(findMemberV2(req));
case 'createMember': return json(createMember(req));
case 'createAdmin': return json(createAdmin(req));
case 'setAdminStatus': return json(setAdminStatus(req));
*/


/* T2Project Admin payment maintenance
   Admin may edit/delete payments belonging to members assigned to that Admin.
   Member is the first-level cross-check; Owner statement reconciliation is separate.
*/
const V2_PAYMENTS_SHEET='Payments';
function v2PaymentAccess_(auth,citizenId){
  if(auth.session.role==='owner')return true;
  const d=v2Rows_(MEMBERS_SHEET),cid=String(citizenId||'').replace(/[\s-]/g,'');
  for(const r of d.rows){if(!r.some(Boolean))continue;const x=v2Obj_(d.headers,r);if(String(x.citizen_id||'').replace(/[\s-]/g,'')===cid)return x.admin_id===auth.admin.admin_id}
  return false;
}
function updatePayment(req){
  const auth=v2RequireAdmin_(req.token);if(!auth)return {ok:false,auth:false,message:'Unauthorized'};
  const id=String(req.paymentId||'').trim(),ref=String(req.referenceNo||'').trim();
  if(!id)return {ok:false,message:'ไม่พบรหัสรายการ'};
  if(!/^\d{6}$/.test(ref))return {ok:false,message:'รหัสสลิปต้องเป็นตัวเลข 6 หลัก'};
  const d=v2Rows_(V2_PAYMENTS_SHEET);
  for(let i=0;i<d.rows.length;i++){
    const x=v2Obj_(d.headers,d.rows[i]);
    const pid=String(x.payment_id||x.paymentId||d.rows[i][0]||'');
    if(pid!==id)continue;
    const cid=x.citizen_id||x.citizenId||d.rows[i][1]||'';
    if(!v2PaymentAccess_(auth,cid))return {ok:false,auth:false,message:'ไม่มีสิทธิ์แก้ไขรายการนี้'};
    for(let k=0;k<d.rows.length;k++){if(k===i)continue;const y=v2Obj_(d.headers,d.rows[k]);const yref=String(y.reference_no||y.referenceNo||d.rows[k][7]||'').trim();if(yref===ref)return {ok:false,duplicate:true,message:'รหัสสลิปนี้มีอยู่แล้ว'}}
    const values=d.rows[i].slice();
    values[4]=Number(req.amount||0);values[5]=String(req.transferDate||'');values[6]=String(req.transferTime||'');values[7]=ref;
    values[9]=String(req.notes||'');values[10]=String(req.rulePeriod||'');values[11]=Number(req.promoReturn||0);
    d.sheet.getRange(i+2,1,1,Math.max(12,values.length)).setValues([values.slice(0,Math.max(12,values.length))]);
    return {ok:true,paymentId:id};
  }
  return {ok:false,message:'ไม่พบรายการ'};
}
function deletePayment(req){
  const auth=v2RequireAdmin_(req.token);if(!auth)return {ok:false,auth:false,message:'Unauthorized'};
  const id=String(req.paymentId||'').trim();if(!id)return {ok:false,message:'ไม่พบรหัสรายการ'};
  const d=v2Rows_(V2_PAYMENTS_SHEET);
  for(let i=0;i<d.rows.length;i++){
    const x=v2Obj_(d.headers,d.rows[i]),pid=String(x.payment_id||x.paymentId||d.rows[i][0]||'');
    if(pid!==id)continue;
    const cid=x.citizen_id||x.citizenId||d.rows[i][1]||'';
    if(!v2PaymentAccess_(auth,cid))return {ok:false,auth:false,message:'ไม่มีสิทธิ์ลบรายการนี้'};
    d.sheet.deleteRow(i+2);return {ok:true,paymentId:id};
  }
  return {ok:false,message:'ไม่พบรายการ'};
}
/* Add to doPost switch:
case 'updatePayment': return json(updatePayment(req));
case 'deletePayment': return json(deletePayment(req));
*/


/* Member profile central storage for Owner dossier */
const MEMBER_PROFILES_SHEET='MemberProfiles', BENEFICIARIES_SHEET='Beneficiaries', MEMBER_CONTACTS_SHEET='MemberContacts';
function v2MemberSession_(token){const x=requireMember(token);return x||null}
function v2MemberCitizen_(session){return String(session.documentId||session.citizenId||session.citizen_id||'').replace(/[\s-]/g,'')}
function getMyProfile(req){
  const ses=v2MemberSession_(req.token);if(!ses)return {ok:false,auth:false,message:'Unauthorized'};
  const cid=v2MemberCitizen_(ses),p=v2Rows_(MEMBER_PROFILES_SHEET);let profile={};
  p.rows.forEach(r=>{const x=v2Obj_(p.headers,r);if(String(x.citizen_id||'').replace(/[\s-]/g,'')===cid)profile=x});
  const b=v2Rows_(BENEFICIARIES_SHEET),c=v2Rows_(MEMBER_CONTACTS_SHEET);
  return {ok:true,profile:profile,beneficiaries:b.rows.filter(r=>String(v2Obj_(b.headers,r).citizen_id||'').replace(/[\s-]/g,'')===cid).map(r=>v2Obj_(b.headers,r)),contacts:c.rows.filter(r=>String(v2Obj_(c.headers,r).citizen_id||'').replace(/[\s-]/g,'')===cid).map(r=>v2Obj_(c.headers,r))};
}
function saveMyProfile(req){
  const ses=v2MemberSession_(req.token);if(!ses)return {ok:false,auth:false,message:'Unauthorized'};
  const cid=v2MemberCitizen_(ses),d=v2Rows_(MEMBER_PROFILES_SHEET),now=Utilities.formatDate(new Date(),'Asia/Bangkok',"yyyy-MM-dd'T'HH:mm:ss");
  const vals=[cid,String(req.memberId||''),String(req.phone||''),String(req.email||''),String(req.bank||''),String(req.bankAccount||''),String(req.address||''),String(req.mapUrl||''),String(req.profilePhoto||''),String(req.idCardFront||''),now];
  let row=0;for(let i=0;i<d.rows.length;i++){if(String(v2Obj_(d.headers,d.rows[i]).citizen_id||'').replace(/[\s-]/g,'')===cid){row=i+2;break}}
  if(row)d.sheet.getRange(row,1,1,vals.length).setValues([vals]);else d.sheet.appendRow(vals);
  return {ok:true};
}
function v2ReplaceMemberRows_(sheetName,cid,rows){
  const d=v2Rows_(sheetName);for(let i=d.rows.length-1;i>=0;i--){if(String(v2Obj_(d.headers,d.rows[i]).citizen_id||'').replace(/[\s-]/g,'')===cid)d.sheet.deleteRow(i+2)}
  rows.forEach(r=>d.sheet.appendRow(r));
}
function saveMyBeneficiaries(req){
 const ses=v2MemberSession_(req.token);if(!ses)return {ok:false,auth:false,message:'Unauthorized'};const cid=v2MemberCitizen_(ses),now=new Date().toISOString(),a=Array.isArray(req.items)?req.items:[];
 v2ReplaceMemberRows_(BENEFICIARIES_SHEET,cid,a.map((x,i)=>[cid,i+1,String(x.firstName||''),String(x.lastName||''),String(x.phone||''),String(x.citizenId||''),String(x.percent||''),now]));return {ok:true}
}
function saveMyContacts(req){
 const ses=v2MemberSession_(req.token);if(!ses)return {ok:false,auth:false,message:'Unauthorized'};const cid=v2MemberCitizen_(ses),now=new Date().toISOString(),a=Array.isArray(req.items)?req.items:[];
 v2ReplaceMemberRows_(MEMBER_CONTACTS_SHEET,cid,a.map((x,i)=>[cid,i+1,String(x.firstName||''),String(x.lastName||''),String(x.phone||''),String(x.relationship||''),now]));return {ok:true}
}
/* Deploy routes in Apps Script doPost:
case 'getMyProfile': return json(getMyProfile(req));
case 'saveMyProfile': return json(saveMyProfile(req));
case 'saveMyBeneficiaries': return json(saveMyBeneficiaries(req));
case 'saveMyContacts': return json(saveMyContacts(req));
*/
