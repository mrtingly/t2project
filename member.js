let MEMBER_MONEY_RULES=[
{n:1,from:"2025-03-11",to:"2025-03-11",tiers:[[100,50000]]},{n:2,from:"2025-03-13",to:"2025-04-17",tiers:[[100,150000]]},{n:3,from:"2025-04-18",to:"2025-04-27",tiers:[[100,100000]]},{n:4,from:"2025-04-28",to:"2025-05-27",tiers:[[100,30000]]},{n:5,from:"2025-05-28",to:"2025-06-21",tiers:[[100,200000]]},{n:6,from:"2025-06-22",to:"2025-07-06",tiers:[[100,250000]]},{n:7,from:"2025-07-07",to:"2025-07-30",tiers:[[100,500000]]},{n:8,from:"2025-07-31",to:"2025-08-11",tiers:[[100,600000]]},{n:9,from:"2025-08-12",to:"2025-08-13",tiers:[[100,800000]]},{n:10,from:"2025-08-14",to:"2025-08-21",tiers:[[100,100000]]},{n:11,from:"2025-08-22",to:"2025-09-18",tiers:[[100,2000000]]},{n:12,from:"2025-09-19",to:"2025-09-25",tiers:[[100,3000000]]},{n:13,from:"2025-09-26",to:"2025-10-08",tiers:[[100,4000000]]},{n:14,from:"2025-10-17",to:"2025-10-25",tiers:[[100,5000000]]},{n:15,from:"2025-10-27",to:"2025-11-10",tiers:[[100,5000000],[400,20000000]]},{n:16,from:"2025-10-27",to:"2025-11-10",tiers:[[500,25000000],[900,45000000]]},{n:17,from:"2025-10-27",to:"2025-11-10",tiers:[[1000,50000000]]},{n:18,from:"2025-10-27",to:"2025-11-10",tiers:[[10000,500000000]]},{n:19,from:"2025-11-15",to:"2025-11-30",tiers:[[500,25000000],[10000,500000000]]},{n:20,from:"2025-12-01",to:"2025-12-12",tiers:[[500,25000000],[10000,500000000]]},{n:21,from:"2025-12-30",to:"2026-01-11",tiers:[[1000,50000000],[2000,100000000]]},{n:22,from:"2026-01-12",to:"2026-01-19",tiers:[[1000,50000000],[2000,100000000]]},{n:23,from:"2026-02-16",to:"2026-03-10",tiers:[[100,1000000]]},{n:24,from:"2026-03-11",to:"2026-03-16",tiers:[[500,20000000]]},{n:25,from:"2026-03-17",to:"2026-03-19",tiers:[[100,4000000],[400,16000000],[500,40000000]]},{n:26,from:"2026-03-19",to:"2026-03-31",tiers:[[100,1000000],[400,4000000],[500,20000000]]},{n:27,from:"2026-03-31",to:"2026-04-05",tiers:[[100,1000000],[400,4000000],[500,20000000],[1000,40000000],[2000,80000000]]},{n:28,from:"2026-04-06",to:"2026-04-21",tiers:[[100,1000000],[500,5000000],[1000,20000000],[2000,40000000]]},{n:29,from:"2026-04-22",to:"2026-04-25",tiers:[[100,2000000],[10000,500000000]]},{n:30,from:"2026-04-30",to:"2026-05-05",tiers:[[100,2000000],[5000,250000000],[10000,600000000]]},{n:31,from:"2026-05-06",to:"2026-05-13",tiers:[[100,100000],[500,500000],[10000,10000000]]},{n:32,from:"2026-05-14",to:"2026-05-15",tiers:[[100,1000000],[10000,100000000]]},{n:33,from:"2026-05-16",to:"2026-06-05",tiers:[[100,1000000],[500,5000000],[1000,10000000],[10000,100000000]]},{n:34,from:"2026-06-09",to:"2026-06-12",tiers:[[300,30000],[10000,10000000]]},{n:35,from:"2026-06-22",to:"2026-06-27",tiers:[[100,50000],[200,100000],[300,150000]]},{n:36,from:"2026-07-03",to:"2026-07-10",tiers:[[100,1000000],[200,2000000],[300,3000000],[10000,10000000]]},{n:37,from:"2026-07-22",to:"2026-08-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},{n:38,from:"2026-08-18",to:"2026-08-20",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},{n:39,from:"2026-09-01",to:"2026-09-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000] ,[1000,200000000]]},{n:40,from:"2026-09-18",to:"2026-09-23",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,500000000]]},
{n:41,from:"2026-10-01",to:"2026-10-05",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,500000000]],exactOnly:true},
/* เอกสารล่าสุด ช่วง 7–19 ต.ค. 2569: เก็บเฉพาะตัวเงิน ไม่รวมทองหรือของแถม */
{n:42,from:"2026-10-07",to:"2026-10-19",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000]],exactOnly:true}
];
let T2_MEMBER_CENTRAL_PROMOS=false;
async function loadMemberCentralPromos(){
 try{const d=await api('getPromos');if(!d.ok||!d.published||!Array.isArray(d.rules))throw Error('unpublished');
 MEMBER_MONEY_RULES=d.rules;T2_MEMBER_CENTRAL_PROMOS=true}
 catch(e){T2_MEMBER_CENTRAL_PROMOS=false;console.warn('Central promotions unavailable')}
}
function memberPromo(x){
 if(!T2_MEMBER_CENTRAL_PROMOS)return {status:'review',receive:0};
 let date=String(x.transferDate||x.transfer_date||x.date||'');
 const bits=date.split('-');if(bits.length===3&&Number(bits[0])>2400)bits[0]=String(Number(bits[0])-543);date=bits.join('-');
 const amount=Number(x.amount||0),rules=MEMBER_MONEY_RULES.filter(r=>date>=r.from&&date<=r.to);
 const matches=rules.map(r=>{const tiers=r.tiers.slice().sort((a,b)=>a[0]-b[0]);const level=tiers.filter(t=>amount>=t[0]).pop()||tiers[0];return level&&amount>0?{period:r.n,receive:Math.round(amount*level[1]/level[0]*100)/100}:null}).filter(Boolean);
 if(new Set(matches.map(v=>v.receive)).size>1)return {status:'review',receive:0};
 return matches.length?{status:'matched',period:matches.map(v=>v.period).join(','),receive:matches[0].receive}:rules.length?{status:'review',receive:0}:{status:'none',receive:0};
}
function memberReward(x){const saved=Number(x.promoReturn??x.promo_return??x.reward??0),current=memberPromo(x);if(Number.isFinite(saved)&&saved>0)return {status:'saved',receive:saved,period:String(x.rulePeriod||x.rule_period||''),needsReview:current.status==='review'||(current.status==='matched'&&current.receive!==saved)};return current}

const API_URL='https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';
const m=JSON.parse(sessionStorage.getItem('t2_member')||'null');if(!m||!m.token)location.href='index.html';
const memberKey=String(m.documentId||m.citizenId||'').trim().replace(/\s+/g,'').toUpperCase();
const key=x=>'t2_'+x+'_'+memberKey;let profile=JSON.parse(localStorage.getItem(key('profile'))||'{}'),beneficiaries=JSON.parse(localStorage.getItem(key('beneficiaries'))||'[]'),contacts=JSON.parse(localStorage.getItem(key('othercontacts'))||'[]'),BILLS=[];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(n){return '฿'+Number(n||0).toLocaleString('th-TH')}
function name(){return m.firstName+' '+m.lastName}
function sameMemberId(v){return String(v??'').trim().replace(/\s+/g,'').toUpperCase()===memberKey}
async function api(action,data={}){const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:m.token,...data})});return r.json()}
let centralProfileReady=false,centralProfileFound=false;
async function loadCentralProfile(){
 const d=await api('getMemberProfile',{profileGrant});
 if(!d.ok)throw Error([d.message,d.error].filter(Boolean).join(' — ')||'Backend ไม่รองรับการอ่านโปรไฟล์');
 centralProfileReady=true;centralProfileFound=!!d.found;
 if(d.found&&d.data){
   profile={...profile,...(d.data.profile||{})};
   beneficiaries=Array.isArray(d.data.beneficiaries)?d.data.beneficiaries:[];
   contacts=Array.isArray(d.data.contacts)?d.data.contacts:[];
   localStorage.setItem(key('profile'),JSON.stringify(profile));
   localStorage.setItem(key('beneficiaries'),JSON.stringify(beneficiaries));
   localStorage.setItem(key('othercontacts'),JSON.stringify(contacts));
 }
 fillEdit();renderBeneficiaries();renderContacts();renderProfile();
 await t2RefreshCentralPhoto();
}
async function init(){id4.textContent=memberKey.slice(-4);fillEdit();renderProfile();renderBeneficiaries();renderContacts();try{const s=await api('checkSession');if(!s.ok){logout();return}try{await loadCentralProfile()}catch(e){centralProfileReady=false;window.t2ProfileError=String(e.message||e);console.warn('Central profile unavailable:',window.t2ProfileError);}void 0;}catch(e){allBills.innerHTML='<div class="warn">เชื่อมต่อรายการชำระเงินไม่ได้ กรุณาลองใหม่</div>'}}
let memberPaymentsLoading=null;
async function loadMemberPaymentsOnDemand(){
 if(memberPaymentsLoading)return memberPaymentsLoading;
 memberPaymentsLoading=(async()=>{await loadMemberCentralPromos();await loadBills()})().finally(()=>{memberPaymentsLoading=null});
 return memberPaymentsLoading;
}
function toggleMemberMenu(){memberMenu.classList.toggle('open');memberShade.classList.toggle('show')}
function showPage(id){document.querySelectorAll('.memberPage').forEach(x=>x.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');toggleMemberMenu();if(id==='payments')loadMemberPaymentsOnDemand()}
function fillEdit(){firstName.value=m.firstName;lastName.value=m.lastName;citizenId.value=memberKey;phone.value=profile.phone||'';email.value=profile.email||'';bank.value=profile.bank||'';bankAccount.value=profile.bankAccount||'';address.value=profile.address||'';mapUrl.value=profile.mapUrl||'';updateMapLink();if(profile.photo){editAvatar.innerHTML='<img src="'+profile.photo+'">';avatar.innerHTML='<img src="'+profile.photo+'">'}t2RenderIdCardPreview()}
let showFullCitizenId=false;
function toggleCitizenId(){showFullCitizenId=!showFullCitizenId;renderProfile()}
function renderProfile(){
 displayName.textContent=name();
 profileView.innerHTML='<div class="profileInfo"><div><small>ชื่อ-นามสกุล</small><b>'+esc(name())+'</b></div><div><small>ข้อมูลส่วนบุคคล</small><b>🔒 ปกปิดเพื่อความปลอดภัย</b></div><div><small>เบอร์โทรศัพท์</small><b>••••••'+esc(String(profile.phone||'').slice(-4))+'</b></div><div><small>อีเมล</small><b>🔒 ปกปิด</b></div><div><small>บัญชีธนาคาร</small><b>🔒 ปกปิด</b></div><div><small>ที่อยู่และพิกัด</small><b>🔒 ปกปิด</b></div></div><div class="profileInfo"><div><small>ผู้ติดต่อเพิ่มเติม</small><b>'+contacts.length+' รายชื่อ (ปกปิดรายละเอียด)</b></div><div><small>ผู้รับผลประโยชน์</small><b>'+beneficiaries.length+' รายชื่อ (ปกปิดรายละเอียด)</b></div></div><p style="padding:12px;color:#506580;font-size:13px">🔒 ข้อมูลสำคัญจะเปิดให้ดูหรือแก้ไขหลังยืนยันตัวตนใหม่ผ่านระบบที่ปลอดภัย</p>';
}
let profileGrant='',profileGrantUntil=0;
async function setEdit(v){
 if(v){
  if(!profileGrant||Date.now()>profileGrantUntil){
   try{
    const status=await api('profilePasswordStatus');
    if(!status.ok){alert('ระบบยืนยันตัวตนยังไม่พร้อม กรุณาตรวจสอบ Backend');return}
    const pw=window.prompt(status.hasPassword?'กรอกรหัสผ่านเพื่อเปิดโปรไฟล์ (สิทธิ์ 10 นาที)':'ตั้งรหัสผ่านใหม่อย่างน้อย 12 ตัว มีตัวอักษรอังกฤษและตัวเลข');
    if(pw===null)return;
    if(!status.hasPassword){
     const confirmation=window.prompt('กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน');
     if(confirmation!==pw){alert('รหัสผ่านไม่ตรงกัน');return}
     const setup=await api('setupProfilePassword',{password:pw});
     if(!setup.ok){alert(setup.message||'ตั้งรหัสผ่านไม่สำเร็จ');return}
    }
    const unlock=await api('unlockMemberProfile',{password:pw});
    if(!unlock.ok){alert(unlock.message||'ยืนยันตัวตนไม่สำเร็จ');return}
    profileGrant=unlock.profileGrant;profileGrantUntil=Date.now()+Math.min(600,unlock.expiresIn||600)*1000;centralProfileReady=true;
    const d=await api('getMemberProfile',{profileGrant});
    if(!d.ok){alert(d.message||'ไม่สามารถโหลดโปรไฟล์');return}
    if(d.found&&d.data){profile={...profile,...d.data.profile};contacts=d.data.contacts||[];beneficiaries=d.data.beneficiaries||[]}
    fillEdit();renderContacts();renderBeneficiaries();
   }catch(e){alert('ไม่สามารถติดต่อระบบยืนยันตัวตนได้');return}
  }
 }
 profileView.classList.toggle('hidden',v);profileEdit.classList.toggle('hidden',!v);if(v)fillEdit();
}
let t2PendingProfilePhoto=null;
async function t2EncodeProfilePhoto(file){
 return new Promise((resolve,reject)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{
   URL.revokeObjectURL(url);
   const c=document.createElement('canvas'),max=360,scale=Math.min(1,max/Math.max(img.width,img.height));
   c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
   c.getContext('2d').drawImage(img,0,0,c.width,c.height);
   let data=c.toDataURL('image/jpeg',0.75);
   if(data.length>230000)data=c.toDataURL('image/jpeg',0.55);
   if(data.length>230000){reject(Error('รูปใหญ่เกินไป กรุณาใช้รูปขนาดเล็ก'));return}
   resolve(data);
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('ไม่สามารถอ่านภาพได้'))};
  img.src=url;
 });
}
async function t2RefreshCentralPhoto(){
 try{
  const d=await api('getMemberPhoto',{profileGrant});
  if(!d.ok||!d.found||!d.dataUrl)return;
  profile.photo=d.dataUrl;
  editAvatar.innerHTML='<img src="'+d.dataUrl+'">';
  avatar.innerHTML='<img src="'+d.dataUrl+'">';
 }catch(e){console.warn('Profile photo load unavailable')}
}
async function previewPhoto(input){
 const f=input.files[0];if(!f)return;
 try{
  const image=await t2EncodeProfilePhoto(f);
  t2PendingProfilePhoto=image;
  profile.photo=image;
  editAvatar.innerHTML='<img src="'+image+'">';
  avatar.innerHTML='<img src="'+image+'">';
 }catch(e){alert(e.message||'ไม่สามารถอ่านรูปโปรไฟล์ได้')}
}
let cardMaskSource='',cardMaskRects=[],cardMaskDrag=null;
function openCardMask(){
 const src=profile.idCardPhoto;
 if(!src){alert('กรุณาเลือกรูปบัตรประชาชนก่อน');return}
 cardMaskSource=src;cardMaskRects=[];
 const panel=document.getElementById('cardMaskPanel');panel.style.display='block';
 const img=new Image();img.onload=()=>{const canvas=document.getElementById('cardMaskCanvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;drawCardMask()};img.src=src;
 panel.scrollIntoView({behavior:'smooth',block:'center'});
}
function drawCardMask(){
 const cv=document.getElementById('cardMaskCanvas'),ctx=cv.getContext('2d');if(!cv.width)return;
 const img=new Image();img.onload=()=>{ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(img,0,0,cv.width,cv.height);ctx.fillStyle='#111';for(const r of cardMaskRects)ctx.fillRect(r.x,r.y,r.w,r.h);if(cardMaskDrag){ctx.strokeStyle='#e11d48';ctx.lineWidth=Math.max(2,cv.width/250);ctx.strokeRect(cardMaskDrag.x,cardMaskDrag.y,cardMaskDrag.w,cardMaskDrag.h)}};img.src=cardMaskSource;
 document.getElementById('cardMaskCount').textContent='ปิดทับแล้ว '+cardMaskRects.length+'/2 จุด';
}
function cardPoint(ev){const cv=document.getElementById('cardMaskCanvas'),b=cv.getBoundingClientRect();return{x:Math.max(0,Math.min(cv.width,(ev.clientX-b.left)*cv.width/b.width)),y:Math.max(0,Math.min(cv.height,(ev.clientY-b.top)*cv.height/b.height))}}
function cardDown(ev){if(cardMaskRects.length>=2)return;const p=cardPoint(ev);cardMaskDrag={x:p.x,y:p.y,w:0,h:0};ev.currentTarget.setPointerCapture(ev.pointerId)}
function cardMove(ev){if(!cardMaskDrag)return;const p=cardPoint(ev);cardMaskDrag.w=p.x-cardMaskDrag.x;cardMaskDrag.h=p.y-cardMaskDrag.y;drawCardMask()}
function cardUp(ev){if(!cardMaskDrag)return;const r=cardMaskDrag;cardMaskDrag=null;const x=Math.min(r.x,r.x+r.w),y=Math.min(r.y,r.y+r.h),w=Math.abs(r.w),h=Math.abs(r.h);if(w>10&&h>10)cardMaskRects.push({x,y,w,h});drawCardMask()}
function resetCardMask(){cardMaskRects=[];cardMaskDrag=null;drawCardMask()}
function confirmCardMask(){
 if(cardMaskRects.length!==2){alert('กรุณาลากกรอบปิดวันออกบัตรและวันหมดอายุให้ครบ 2 จุด');return}
 const cv=document.getElementById('cardMaskCanvas'),out=document.createElement('canvas');out.width=cv.width;out.height=cv.height;const ctx=out.getContext('2d');const img=new Image();
 img.onload=()=>{ctx.drawImage(img,0,0,out.width,out.height);ctx.fillStyle='#111';cardMaskRects.forEach(r=>ctx.fillRect(r.x,r.y,r.w,r.h));const masked=out.toDataURL('image/png');profile.idCardMasked=masked;try{localStorage.setItem(key('profile'),JSON.stringify(profile))}catch(e){alert('พื้นที่เก็บรูปในเบราว์เซอร์เต็ม กรุณาใช้รูปขนาดเล็กลง');return}document.getElementById('cardMaskPanel').style.display='none';renderProfile();alert('สร้างรูปบัตรที่ปิดทับวันที่แล้ว กรุณาตรวจภาพบนหน้า Profile อีกครั้ง')};img.src=cardMaskSource;
}
let t2IdCardReadGeneration=0;
function t2RenderIdCardPreview(){
 const img=document.getElementById('idCardPreview');
 if(!img)return;
 if(profile.idCardPhoto){
  img.src=profile.idCardPhoto;
  img.classList.remove('hidden');
  img.style.display='block';
 }else{
  img.removeAttribute('src');
  img.classList.add('hidden');
  img.style.display='none';
 }
}
function removeIdCardPhoto(){
 const image=document.getElementById('idCardPreview');
 const input=document.getElementById('idCardPhoto');
 if(!profile.idCardPhoto&&!input?.files?.length&&!image?.getAttribute('src')){
  alert('ไม่มีรูปบัตรประชาชนให้ลบ');return;
 }
 if(!confirm('ยืนยันลบรูปบัตรประชาชนของสมาชิกออกจากเครื่องนี้หรือไม่?'))return;
 t2IdCardReadGeneration++; // cancel in-flight FileReader results
 delete profile.idCardPhoto;
 if(input)input.value='';
 cardMaskSource='';cardMaskRects=[];cardMaskDrag=null;
 const panel=document.getElementById('cardMaskPanel');if(panel)panel.style.display='none';
 t2RenderIdCardPreview();
 try{localStorage.setItem(key('profile'),JSON.stringify(profile))}
 catch(e){alert('ลบภาพบนหน้าจอแล้ว แต่บันทึกการลบในเครื่องไม่สำเร็จ');return}
 alert('ลบรูปบัตรประชาชนบนเครื่องนี้เรียบร้อยแล้ว');
}
function previewIdCard(input){
 const f=input.files[0];if(!f)return;
 const generation=++t2IdCardReadGeneration;
 const r=new FileReader();
 r.onload=()=>{
  if(generation!==t2IdCardReadGeneration)return;
  profile.idCardPhoto=r.result;
  t2RenderIdCardPreview();
 };
 r.onerror=()=>alert('อ่านรูปบัตรประชาชนไม่สำเร็จ');
 r.readAsDataURL(f);
}
function updateMapLink(){if(!window.openMapPin||!window.mapUrl)return;const u=mapUrl.value.trim();openMapPin.classList.toggle('hidden',!u);if(u)openMapPin.href=u}
async function saveProfile(){
 if(!profileGrant||Date.now()>profileGrantUntil){alert('สิทธิ์หมดอายุ กรุณายืนยันตัวตนอีกครั้ง');return}
 const b=beneficiaryDraft(),t=contactDraft(),err=validateBeneficiaries(b);
 if(err){alert(err);return}
 const validContacts=t.filter(c=>c.firstName&&c.lastName&&c.phone);
 if(validContacts.length<2||t.some(c=>!c.firstName||!c.lastName||!c.phone)){
   alert('กรุณาระบุผู้ติดต่อฉุกเฉินอย่างน้อย 2 คน พร้อมชื่อ นามสกุล และเบอร์โทรศัพท์ให้ครบทุกคน');return;
 }
 if(b.some(x=>!x.firstName||!x.lastName||!x.phone||!x.citizenId||x.percent==='')){
   alert('กรุณากรอกข้อมูลผู้รับผลประโยชน์แต่ละคนให้ครบ หรือยกเลิกรายการที่ยังไม่ต้องการบันทึก');return;
 }
 const nextProfile={...profile,phone:phone.value.trim(),email:email.value.trim(),bank:bank.value.trim(),bankAccount:bankAccount.value.trim(),address:address.value.trim(),mapUrl:mapUrl.value.trim()};
 const btn=document.querySelector('#profileEdit .primary');if(btn)btn.disabled=true;
 try{
   const d=await api('saveMemberProfile',{profileGrant,data:{profile:nextProfile,contacts:t,beneficiaries:b}});
   if(!d.ok){alert(d.message||'บันทึกข้อมูลไม่สำเร็จ');return}
   if(t2PendingProfilePhoto){
     const payload=t2PendingProfilePhoto.split(',');
     const uploaded=await api('uploadMemberPhoto',{profileGrant,mimeType:'image/jpeg',base64:payload[1]||''});
     if(!uploaded.ok){alert('บันทึกข้อมูลโปรไฟล์สำเร็จ แต่รูปยังไม่ถูกบันทึกส่วนกลาง: '+(uploaded.message||'กรุณาลองอีกครั้ง'));return}
     t2PendingProfilePhoto=null;
   }
   profile=nextProfile;beneficiaries=b;contacts=t;centralProfileFound=true;
   // ชื่อสมาชิกยึดฐาน Master จนกว่า Backend จะยืนยันการเปลี่ยนชื่ออย่างถูกต้อง
   localStorage.setItem(key('profile'),JSON.stringify(profile));
   localStorage.setItem(key('beneficiaries'),JSON.stringify(beneficiaries));
   localStorage.setItem(key('othercontacts'),JSON.stringify(contacts));
   renderProfile();renderBeneficiaries();renderContacts();setEdit(false);
   alert('บันทึกโปรไฟล์ลงฐานข้อมูลกลางเรียบร้อยแล้ว');
 }catch(e){alert('เชื่อมต่อฐานข้อมูลกลางไม่สำเร็จ ข้อมูลยังไม่ถูกบันทึก')}
 finally{if(btn)btn.disabled=false}
}
function beneficiaryDraft(){return Array.from(document.querySelectorAll('.beneficiaryCard:not(.contactCard)')).map(e=>({firstName:e.querySelector('.bf').value.trim(),lastName:e.querySelector('.bl').value.trim(),phone:e.querySelector('.bp').value.trim(),citizenId:e.querySelector('.bi').value.trim(),percent:e.querySelector('.pct').value.trim()}))}
function contactDraft(){return Array.from(document.querySelectorAll('.contactCard')).map(e=>({firstName:e.querySelector('.cf').value.trim(),lastName:e.querySelector('.cl').value.trim(),phone:e.querySelector('.cp').value.trim()}))}
function validateBeneficiaries(items){let sum=0;for(const b of items){if(b.percent!==''&&(!Number.isFinite(Number(b.percent))||Number(b.percent)<0||Number(b.percent)>100))return 'เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 ถึง 100';sum+=Number(b.percent||0)}if(sum>100.000001)return 'ผลรวมผู้รับผลประโยชน์ '+sum.toLocaleString('th-TH')+'% เกิน 100%';return ''}
function persistRelations(){const b=beneficiaryDraft(),t=contactDraft(),error=validateBeneficiaries(b);if(error){alert(error);return false}beneficiaries=b;contacts=t;localStorage.setItem(key('beneficiaries'),JSON.stringify(b));localStorage.setItem(key('othercontacts'),JSON.stringify(t));renderBeneficiaries();renderContacts();renderProfile();return true}
function addBeneficiary(){beneficiaries=beneficiaryDraft();beneficiaries.push({firstName:'',lastName:'',phone:'',citizenId:'',percent:''});renderBeneficiaries()}
function removeBeneficiary(i){beneficiaries=beneficiaryDraft();beneficiaries.splice(i,1);renderBeneficiaries()}
function saveBeneficiaries(){alert('กรุณากด บันทึก Profile ด้านบน เพื่อบันทึกข้อมูลทั้งหมดลงฐานกลาง')}
function renderBeneficiaries(){beneficiaryList.innerHTML=beneficiaries.map((b,i)=>'<div class="beneficiaryCard"><div class="cardHead"><b>ผู้รับผลประโยชน์ '+(i+1)+'</b><button type="button" onclick="removeBeneficiary('+i+')">ลบ</button></div><div class="twoCol"><label>ชื่อ<input class="bf" value="'+esc(b.firstName)+'"></label><label>นามสกุล<input class="bl" value="'+esc(b.lastName)+'"></label></div><label>เบอร์โทรศัพท์<input class="bp" value="'+esc(b.phone)+'"></label><label>เลขบัตรประชาชน<input class="bi" maxlength="13" value="'+esc(b.citizenId)+'"></label><label>ผลประโยชน์ (%)<input class="pct" type="number" min="0" max="100" step="any" value="'+esc(b.percent)+'"></label></div>').join('');if(beneficiaries.length)beneficiaryList.innerHTML+='<button class="primary" type="button" onclick="saveBeneficiaries()">บันทึกผู้รับผลประโยชน์</button>'}
function addContact(){contacts=contactDraft();contacts.push({firstName:'',lastName:'',phone:''});renderContacts()}
function removeContact(i){contacts=contactDraft();if(contacts.length<=2){alert('ต้องมีผู้ติดต่อฉุกเฉินอย่างน้อย 2 คน');return}contacts.splice(i,1);renderContacts()}
function saveContacts(){alert('กรุณากด บันทึก Profile ด้านบน เพื่อบันทึกข้อมูลทั้งหมดลงฐานกลาง')}
function renderContacts(){while(contacts.length<2)contacts.push({firstName:'',lastName:'',phone:''});contactList.innerHTML=contacts.map((c,i)=>'<div class="beneficiaryCard contactCard"><div class="cardHead"><b>บุคคลติดต่อ '+(i+1)+'</b><button type="button" onclick="removeContact('+i+')">ลบ</button></div><div class="twoCol"><label>ชื่อ<input class="cf" value="'+esc(c.firstName)+'"></label><label>นามสกุล<input class="cl" value="'+esc(c.lastName)+'"></label></div><label>เบอร์โทรศัพท์<input class="cp" value="'+esc(c.phone)+'"></label></div>').join('');if(contacts.length)contactList.innerHTML+='<button class="primary" type="button" onclick="saveContacts()">บันทึกผู้ติดต่อ</button>'}
async function loadBills(){allBills.innerHTML='<div class="info">กำลังโหลดรายการ...</div>';const d=await api('getMyPayments');if(!d.ok){allBills.innerHTML='<div class="warn">ไม่สามารถโหลดรายการได้</div>';return}const rows=d.items||d.payments||[];BILLS=rows.filter(x=>{const id=x.documentId||x.document_id||x.citizenId||x.citizen_id||'';if(id)return sameMemberId(id);const fn=String(x.firstName||x.first_name||'').trim(),ln=String(x.lastName||x.last_name||'').trim();return fn===String(m.firstName||'').trim()&&ln===String(m.lastName||'').trim()});BILLS.sort((a,b)=>String(b.transferDate||b.transfer_date||b.date||'').localeCompare(String(a.transferDate||a.transfer_date||a.date||''))||String(b.transferTime||b.transfer_time||b.time||'').localeCompare(String(a.transferTime||a.transfer_time||a.time||'')));renderBills()}
function ref6(x){const r=String(x.referenceNo||x.reference_no||x.reference||'').trim();return r.length>6?r.slice(-6):r}
function receiptUrl(x){return String(x.receipt||x.receiptUrl||x.receipt_url||x.slip||'').trim()}
function payerName(x){return String(x.payerName||x.payer_name||x.senderName||x.sender_name||x.transferName||x.transfer_name||name()).trim()}
function receiverName(x){return String(x.receiverName||x.receiver_name||x.payeeName||x.payee_name||x.recipientName||x.recipient_name||'T2Project').trim()}
function memberRewardFlag(x){const pr=memberReward(x);return pr.needsReview?' ⚠ โปรเดิมรอตรวจ':''}
function memberReviewLabel(x){const v=String(x.reviewStatus||x.review_status||x.memberStatus||'pending').toLowerCase();return v==='confirmed'?'สมาชิกยืนยันแล้ว':v==='incorrect'?'แจ้งข้อมูลผิด — รอตรวจสอบ':'รอสมาชิกตรวจสอบ'}
function renderBills(){const paid=BILLS.reduce((s,x)=>s+Number(x.amount||0),0),reward=BILLS.reduce((s,x)=>s+memberReward(x).receive,0);sumPaid.textContent=profileInvestment.textContent=money(paid);sumReward.textContent=profileReward.textContent=money(reward);billCount.textContent=BILLS.length;profileBillCount.textContent=BILLS.length+' สลิป';const reportHtml=BILLS.length?'<div class="receiptTableWrap"><table class="receiptTable"><thead><tr><th>ลำดับ</th><th>วัน/เดือน/ปี</th><th>เวลา</th><th>ชื่อผู้โอน</th><th>ชื่อผู้รับ</th><th>รหัสใบเสร็จ 6 หลักท้าย</th><th>ราคา</th><th>รายรับ</th><th>จัดการ</th></tr></thead><tbody>'+BILLS.map((x,i)=>{const url=receiptUrl(x);return '<tr><td>'+(i+1)+'</td><td>'+esc(x.transferDate||x.transfer_date||x.date||'—')+'</td><td>'+esc(x.transferTime||x.transfer_time||x.time||'—')+'</td><td>'+esc(payerName(x)||'—')+'</td><td>'+esc(receiverName(x)||'—')+'</td><td><b>'+esc(ref6(x)||'—')+'</b></td><td>'+money(x.amount)+'</td><td>'+(()=>{const pr=memberReward(x);return pr.status==='none'?'<span title="ไม่พบโปรในวันที่นี้">ไม่มีโปร</span>':pr.status==='review'?'<span title="ยอดนี้ต้องตรวจเงื่อนไขโปร">ตรวจโปร</span>':money(pr.receive)+memberRewardFlag(x)})()+'</td><td><div class="receiptActions">'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener">ดูสลิป</a><button type="button" onclick="downloadMySlip('+i+')">⬇ ดาวน์โหลดสลิป</button>':'')+'<button onclick="printReceipt('+i+')">พิมพ์</button>'+(x.paymentId||x.payment_id?'<button type="button" onclick="memberReviewAt('+i+',\'confirmed\')">✓ ยืนยันถูกต้อง</button><button type="button" onclick="memberReviewAt('+i+',\'incorrect\')">แจ้งข้อมูลผิด</button>':'')+'</div><div style="margin-top:7px;font-weight:600">สถานะตรวจสอบ: '+esc(memberReviewLabel(x))+'</div></td></tr>'}).join('')+'</tbody></table></div>':'<div class="emptyState"><b>ยังไม่มีรายการลงทุน</b><small>รายการลงทุนของสมาชิกจะแสดงที่นี่</small></div>';allBills.innerHTML=reportHtml;if(window.profileSlipList)profileSlipList.innerHTML=reportHtml}
function memberSlipPrintUrl(x){
 const u=receiptUrl(x);if(!u)return '';
 try{const parsed=new URL(u,location.href);if(parsed.protocol!=='https:')return '';
 const match=parsed.pathname.match(/file\/d\/([A-Za-z0-9_-]+)/);
 const id=match?.[1]||parsed.searchParams.get('id');
 if(id&&(parsed.hostname==='drive.google.com'||parsed.hostname==='docs.google.com'))return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1600';
 return ''}catch(e){return ''}
}
function receiptHtml(x,i){
 const data=[['วันที่โอน',x.transferDate||x.transfer_date||x.date||'—'],['เวลา',x.transferTime||x.transfer_time||x.time||'—'],['ผู้โอน',payerName(x)||'—'],['ผู้รับ',receiverName(x)||'—'],['รหัสอ้างอิง 6 หลักท้าย',ref6(x)||'—'],['ยอดลงทุน',money(x.amount)],['ผลตอบแทนตามโปร',memberReward(x).status==='matched'?money(memberReward(x).receive):'ต้องตรวจสอบ'],['หมายเหตุ',x.notes||x.note||'—']];
 const url=memberSlipPrintUrl(x);
 return '<section class="printReceipt"><header class="printBrand"><b>T2Project</b><span>รายการสลิปของสมาชิก</span></header><h2>สลิปรายการที่ '+(i+1)+'</h2><div class="printGrid">'+data.map(v=>'<div><small>'+esc(v[0])+'</small><b>'+esc(v[1])+'</b></div>').join('')+'</div><div class="memberPrintSlip"><strong>ภาพสลิปหลักฐานการโอน</strong>'+(url?'<img class="memberSlipPhoto" src="'+esc(url)+'" alt="ภาพสลิป">':'<p class="memberPrintMissing">ไม่พบภาพสลิป</p>')+'</div></section>';
}
function openPrint(html,title){
 const w=window.open('','_blank');if(!w){alert('กรุณาอนุญาตหน้าต่างพิมพ์');return}
 const css='@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#0d3158;margin:0}.printReceipt{height:276mm;break-after:page;page-break-after:always;padding:6mm;overflow:hidden}.printReceipt:last-child{break-after:auto;page-break-after:auto}.printBrand{display:flex;justify-content:space-between;border-bottom:2px solid #123f70;padding-bottom:7px}.printGrid{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;margin-top:9px}.printGrid div{border-bottom:1px solid #e3e9f0;padding:3px 0}.printGrid small,.printGrid b{display:block}.printGrid small{font-size:10px;color:#71839a}.memberPrintSlip{text-align:center;margin-top:8px}.memberSlipPhoto{display:block;margin:6px auto;max-width:100%;max-height:140mm;object-fit:contain}.memberPrintMissing{color:#b42318}.printToolbar{padding:12px;background:#eef4ff;display:flex;gap:10px}.printToolbar button{padding:9px 15px}@media print{.printToolbar{display:none}}';
 w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+css+'</style></head><body><div class="printToolbar"><button id="memberPrintButton">พิมพ์ / บันทึก PDF</button><span id="memberPrintStatus">กำลังตรวจภาพ...</span></div>'+html+'</body></html>');
 w.document.close();
 const button=w.document.getElementById('memberPrintButton'),status=w.document.getElementById('memberPrintStatus');
 button.onclick=()=>{const pics=[...w.document.querySelectorAll('.memberSlipPhoto')];const slips=w.document.querySelectorAll('.printReceipt').length;if(pics.length!==slips||pics.some(img=>!img.complete||!img.naturalWidth)){alert('ภาพสลิปยังไม่ครบหรือโหลดไม่สำเร็จ โปรดตรวจสอบภาพจริงก่อนพิมพ์');return}w.print()};
 const pics=[...w.document.querySelectorAll('.memberSlipPhoto')];if(!pics.length){status.textContent='ไม่มีภาพสลิปในรายการนี้';return}
 let done=0;pics.forEach(img=>{const tick=()=>{done++;if(done===pics.length)status.textContent=pics.every(i=>i.naturalWidth>0)?'ภาพพร้อมพิมพ์':'บางภาพโหลดไม่ได้ กรุณาตรวจสิทธิ์ Google Drive'};if(img.complete)tick();else{img.onload=tick;img.onerror=tick}});
}
function printReceipt(i){const x=BILLS[i];if(!x)return;openPrint(receiptHtml(x,i),'T2Project Receipt '+(i+1))}
function printAllReceipts(){if(!BILLS.length){alert('ยังไม่มีรายการสำหรับพิมพ์');return}openPrint(BILLS.map((x,i)=>receiptHtml(x,i)).join(''),'T2Project Receipts')}

async function reviewPayment(paymentId,reviewStatus,note=''){try{const d=await api('reviewPayment',{paymentId,status:reviewStatus,note:note});if(!d.ok){alert(d.message||'บันทึกสถานะไม่สำเร็จ');return}await loadBills()}catch(e){alert('เชื่อมต่อระบบไม่ได้')}}
function memberReviewAt(i,status){const x=BILLS[i];const id=x&&(x.paymentId||x.payment_id);if(!id){alert('ไม่พบรหัสรายการ');return}if(status==='incorrect')return reviewIncorrect(id);if(confirm('ยืนยันว่าข้อมูลสลิปรายการนี้ถูกต้องใช่หรือไม่?'))reviewPayment(id,'confirmed')}
function reviewIncorrect(id){const note=prompt('กรุณาระบุข้อมูลที่ไม่ถูกต้อง');if(note===null)return;if(!note.trim()){alert('กรุณาระบุรายละเอียด');return}reviewPayment(id,'incorrect',note.trim())}
function logout(){sessionStorage.removeItem('t2_member');location.href='index.html'}
init();
if(window.mapUrl)mapUrl.addEventListener('input',updateMapLink);

function speakProfileNotice(){const t='กรุณาอัปเดตโปรไฟล์ของคุณให้ครบถ้วนและเป็นปัจจุบัน เพื่อประโยชน์ของท่านในการติดต่อ ติดตาม และประสานงานด้านต่าง ๆ ได้อย่างถูกต้อง รวดเร็ว และมีประสิทธิภาพ';if(!('speechSynthesis' in window)){alert('อุปกรณ์นี้ไม่รองรับการอ่านข้อความ');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='th-TH';u.rate=.92;speechSynthesis.speak(u)}

let memberVoiceMode=localStorage.getItem('t2_member_voice')!=='off';
function speakText(t){t=String(t||'').replace(/\s+/g,' ').trim();if(!t||!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='th-TH';u.rate=.9;speechSynthesis.speak(u)}
function readableText(el){if(!el)return'';if(el.matches('input,textarea,select')){const label=el.closest('label');return ((label?label.innerText.replace(el.value||'',''):'')||el.getAttribute('aria-label')||'ช่องข้อมูล')+' '+(el.value||el.placeholder||'ยังไม่มีข้อมูล')}return el.getAttribute('aria-label')||el.innerText||el.textContent||''}
function updateVoiceButton(){if(window.voiceToggle)voiceToggle.checked=memberVoiceMode}
function setVoiceMode(on){memberVoiceMode=!!on;localStorage.setItem('t2_member_voice',memberVoiceMode?'on':'off');if('speechSynthesis' in window)speechSynthesis.cancel();updateVoiceButton();if(memberVoiceMode)speakText('เปิดระบบอ่านออกเสียงแล้ว')}
function toggleVoiceMode(){setVoiceMode(!memberVoiceMode)}
document.addEventListener('click',e=>{if(!memberVoiceMode)return;const el=e.target.closest('button,a,input,textarea,select,th,td,h1,h2,h3,p,small,strong,b,span,.profileInfo>div,.summaryCard,.profileMoney>div,.sectionNote');if(!el||el.id==='voiceModeBtn')return;const t=readableText(el);if(t)setTimeout(()=>speakText(t),20)},true);
document.addEventListener('focusin',e=>{if(memberVoiceMode&&e.target.matches('input,textarea,select'))speakText(readableText(e.target))});
setTimeout(updateVoiceButton,0);

function downloadMyPaymentReport(){
 if(!BILLS.length){alert('ยังไม่มีรายการสลิปให้ดาวน์โหลด');return}
 const rows=[['วันที่','เวลา','ผู้โอน','ผู้รับ','เลขอ้างอิง','จำนวนเงิน','ผลตอบแทนตามโปร','ลิงก์สลิป'],
 ...BILLS.map(x=>[x.transferDate||x.transfer_date||x.date||'',x.transferTime||x.transfer_time||x.time||'',payerName(x),receiverName(x),ref6(x),x.amount||0,memberReward(x).receive,receiptUrl(x)])];
 const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='T2Project_Member_Receipts.csv';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
}

function downloadMySlip(i){
 const x=BILLS[i];if(!x)return;
 const url=receiptUrl(x);
 if(!url){alert('รายการนี้ยังไม่มีภาพสลิป');return}
 let target=url;
 try{
  const parsed=new URL(url,location.href);
  if(!['drive.google.com','docs.google.com'].includes(parsed.hostname))throw Error('ไม่ใช่ลิงก์ Google Drive');
  const match=parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  const id=match?.[1]||parsed.searchParams.get('id');
  if(id&&/^[A-Za-z0-9_-]+$/.test(id))target='https://drive.google.com/uc?export=download&id='+encodeURIComponent(id);
  else target=parsed.href;
 }catch(e){alert('ลิงก์สลิปไม่ถูกต้อง');return}
 const a=document.createElement('a');a.href=target;a.target='_blank';a.rel='noopener';a.click();
}

function printMyProfile(){
 const view=document.getElementById('profileView');
 if(!view){alert('ยังไม่มีข้อมูลโปรไฟล์');return}
 const memberName=document.getElementById('displayName')?.textContent||'สมาชิก';
 const values='<h2>ข้อมูลสมาชิก: '+esc(memberName)+'</h2>'+
 '<p><strong>ยอดลงทุน:</strong> '+esc(document.getElementById('profileInvestment')?.textContent||'')+
 ' &nbsp; <strong>จำนวนสลิป:</strong> '+esc(document.getElementById('profileBillCount')?.textContent||'')+
 ' &nbsp; <strong>ผลตอบแทน:</strong> '+esc(document.getElementById('profileReward')?.textContent||'')+'</p>';
 openPrint('<section class="printReceipt">'+values+view.innerHTML+'</section>','T2PROJECT ข้อมูลสมาชิก');
}
