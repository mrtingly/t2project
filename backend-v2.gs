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
