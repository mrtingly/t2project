const API_URL='https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';let staff=JSON.parse(sessionStorage.getItem('t2_owner')||'null'),REPORT=[];
async function call(action,data={},token=staff&&staff.token){
 const r=await fetch(API_URL,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token,...data})});
 const raw=await r.text();
 try{return JSON.parse(raw)}catch(e){throw new Error('API response is not JSON')}
}
function money(n){return '฿'+Number(n||0).toLocaleString('th-TH')}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function ownerLogin(){ownerLoginResult.innerHTML='<div class="info">กำลังเข้าสู่ระบบ...</div>';try{const d=await call('staffLogin',{username:ownerUser.value.trim(),password:ownerPass.value},null);if(d.ok&&d.token&&d.role==='owner'){staff={token:d.token,role:d.role,username:ownerUser.value.trim()};sessionStorage.setItem('t2_owner',JSON.stringify(staff));showDashboard();await Promise.all([loadOwnerReport(),loadOwnerMembers()])}else ownerLoginResult.innerHTML='<div class="warn">Username หรือ Password ไม่ถูกต้อง</div>'}catch(e){console.error('Owner login error',e);ownerLoginResult.innerHTML='<div class="warn">เชื่อมต่อ API ไม่สำเร็จ<br><small>'+esc(e&&e.message?e.message:e)+'</small></div>'}}
async function boot(){if(!staff||!staff.token)return;try{const d=await call('checkSession');if(d.ok&&d.role==='owner'){showDashboard();loadOwnerReport();loadOwnerMembers()}else sessionStorage.removeItem('t2_owner')}catch(e){}}
function showDashboard(){document.getElementById('ownerLogin').classList.add('hidden');document.getElementById('ownerDashboard').classList.remove('hidden');document.getElementById('ownerLogout').classList.remove('hidden')}
function iso(d){return d.toISOString().slice(0,10)}function setRange(k){const n=new Date(),e=iso(n);if(k==='today'){oFrom.value=e;oTo.value=e}else if(k==='month'){oFrom.value=iso(new Date(n.getFullYear(),n.getMonth(),1));oTo.value=e}else if(k==='year'){oFrom.value=iso(new Date(n.getFullYear(),0,1));oTo.value=e}else{oFrom.value='';oTo.value=''}loadOwnerReport()}
function ownerReportPromo(x,rules){
 const saved=Number(x.promoReturn??x.promo_return??x.reward??0);
 const date=String(x.transferDate||x.transfer_date||x.date||'').slice(0,10);
 const normalized=/^25\d\d-/.test(date)?String(Number(date.slice(0,4))-543)+date.slice(4):date;
 const result=ownerPromoCompute(rules,normalized,Number(x.amount||0));
 if(result.status==='matched'&&saved<=0)return {value:result.receive,estimated:true};
 if(saved>0)return {value:saved,estimated:false,conflict:result.status==='conflict'||(result.status==='matched'&&Math.abs(result.receive-saved)>.01)};
 return {value:0,estimated:false,conflict:result.status==='conflict'};
}
async function loadOwnerReport(){ownerRows.innerHTML='<tr><td colspan="7">กำลังโหลดข้อมูล...</td></tr>';try{const d=await call('getReport',{from:oFrom.value,to:oTo.value});if(!d.ok){ownerRows.innerHTML='<tr><td colspan="7">โหลด Report ไม่สำเร็จ</td></tr>';return}REPORT=d.items||d.payments||[];let reportRules=[];
 try{const pd=await call('getPromos');if(pd.ok&&pd.published&&Array.isArray(pd.rules))reportRules=pd.rules}catch(e){}
 const computed=REPORT.map(x=>ownerReportPromo(x,reportRules));
 REPORT.forEach((x,i)=>{x._ownerPromoDisplay=computed[i]});
 OWNER_REPORT_PAGE=0;const s=d.summary||{},statuses=REPORT.map(x=>String(x.reviewStatus||x.review_status||x.memberStatus||'pending').toLowerCase());oCount.textContent=(s.paymentCount??REPORT.length).toLocaleString('th-TH');oMembers.textContent=(s.memberCount??new Set(REPORT.map(x=>x.citizenId||x.citizen_id)).size).toLocaleString('th-TH');oAmount.textContent=money(s.totalAmount??REPORT.reduce((a,x)=>a+Number(x.amount||0),0));oReturn.textContent=money(computed.reduce((a,x)=>a+x.value,0))+(computed.some(x=>x.estimated)?' *':'');oConfirmed.textContent=(s.confirmedCount??statuses.filter(x=>x==='confirmed').length).toLocaleString('th-TH');oIncorrect.textContent=(s.incorrectCount??statuses.filter(x=>x==='incorrect').length).toLocaleString('th-TH');oPending.textContent=(s.pendingCount??statuses.filter(x=>!['confirmed','incorrect'].includes(x)).length).toLocaleString('th-TH');oRangeLabel.textContent=(oFrom.value||oTo.value)?(oFrom.value||'เริ่มต้น')+' ถึง '+(oTo.value||'ปัจจุบัน'):'ทุกช่วงเวลา';ownerRows.innerHTML=REPORT.length?REPORT.slice(OWNER_REPORT_PAGE*50,(OWNER_REPORT_PAGE+1)*50).map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||x.date||'')+' '+esc(x.transferTime||x.transfer_time||x.time||'')+'</td><td>'+esc(x.firstName?x.firstName+' '+x.lastName:(x.member||''))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.rulePeriod||x.rule_period||x.period||'')+'</td><td>'+money(x._ownerPromoDisplay?.value??0)+(x._ownerPromoDisplay?.estimated?' *':'')+(x._ownerPromoDisplay?.conflict?' ⚠':'')+'</td><td><span class="statusPill">'+esc(x.reviewStatus||x.review_status||x.memberStatus||'pending')+'</span></td><td>'+esc(x.memberNote||x.member_note||'—')+'</td></tr>').join('') :'<tr><td colspan="7">ยังไม่มีรายการในช่วงนี้</td></tr>';oRangeLabel.textContent+=' • * ยอดคำนวณจากโปร ยังไม่ได้แก้ฐานสลิป';ownerUpdatePage();ownerRenderDisputes()}catch(e){ownerRows.innerHTML='<tr><td colspan="7">เชื่อมต่อระบบไม่ได้</td></tr>'}}
function ownerCSV(){if(!REPORT.length){alert('ไม่มีข้อมูลสำหรับ Export');return}const rows=[['วันที่','เวลา','สมาชิก','ยอด','ช่วง','ผลตอบแทน (อาจเป็นยอดคำนวณ)','สถานะสมาชิก','หมายเหตุ'],...REPORT.map(x=>[x.transferDate||x.transfer_date||x.date||'',x.transferTime||x.transfer_time||x.time||'',(x.firstName||'')+' '+(x.lastName||''),x.amount||0,x.rulePeriod||x.rule_period||x.period||'',x._ownerPromoDisplay?.value??x.promoReturn??x.promo_return??x.reward??'',x.reviewStatus||x.review_status||'',x.memberNote||x.member_note||''])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='T2Project-Owner-Report-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href)}
async function ownerLogout(){try{await call('staffLogout')}catch(e){}sessionStorage.removeItem('t2_owner');location.reload()}ownerPass.addEventListener('keydown',e=>{if(e.key==='Enter')ownerLogin()});boot();
function toggleOwnerPassword(){const p=document.getElementById('ownerPass'),b=document.querySelector('.passwordToggle');const show=p.type==='password';p.type=show?'text':'password';if(b)b.textContent=show?'ซ่อน':'ดู'}

let OWNER_MEMBERS=[],CURRENT_OWNER_PROFILE=null,OWNER_REPORT_PAGE=0;
const OWNER_ROOM_DIRECTORY=[
 {room:'A+',code:'001',name:'อรวิภา ชัยสงคราม'},
 {room:'A',code:'002',name:'มนัสนันท์ ภพกิตติสิริกุล'},
 {room:'B',code:'003',name:'เมทินี สุมาลี'},
 {room:'C',code:'004',name:'พชรกฤต โสมนัส'},
 {room:'D',code:'005',name:'รุ่งนภา สุภาศรี'},
 {room:'E',code:'006',name:'รมิตา มีคุณ'},
 {room:'F',code:'007',name:'สมาน พันธ์เพ็ง'},
 {room:'G',code:'008',name:'กุลคณินท์ นุดศุภร'}
];
function ownerRoomInfo(m){
 const raw=String(m.room||m.roomName||m.room_code||m.adminId||m.admin_id||'').trim();
 return OWNER_ROOM_DIRECTORY.find(x=>x.room===raw||x.code===raw||'ROOM-'+x.code===raw)||null;
}

async function loadOwnerMembers(){
 try{
  const d=await call('getMyMembers');
  if(!d.ok)return;
  OWNER_MEMBERS=d.items||d.members||[];
  filterOwnerMembers();ownerRenderAdmins();ownerAccessSummary();
 }catch(e){document.getElementById('ownerMemberDetail').textContent='ยังโหลดรายชื่อสมาชิกไม่ได้'}
}
function ownerAccessSummary(){
 const box=document.getElementById('ownerProfileAccessSummary');if(!box)return;
 if(!OWNER_MEMBERS.every(m=>typeof m.profileVisited==='boolean')){box.textContent='สถานะการเข้าโปรไฟล์: รอ Backend รองรับประวัติการเปิดโปรไฟล์';return}
 const yes=OWNER_MEMBERS.filter(m=>m.profileVisited).length;
 box.textContent='สมาชิกทั้งหมด '+OWNER_MEMBERS.length+' คน | เข้าโปรไฟล์แล้ว '+yes+' คน | ยังไม่พบประวัติ '+(OWNER_MEMBERS.length-yes)+' คน';
}
function filterOwnerMembers(){
 const q=String(document.getElementById('ownerMemberSearch').value||'').trim().toLocaleLowerCase('th-TH');
 const select=document.getElementById('ownerMemberSelect'),prev=select.value;
 const list=OWNER_MEMBERS.filter(m=>(String(m.firstName||'')+' '+String(m.lastName||'')+' '+String(m.memberId||'')).toLocaleLowerCase('th-TH').includes(q)).slice(0,100);
 select.innerHTML='<option value="">เลือกสมาชิก</option>'+list.map(m=>'<option value="'+esc(m.memberId)+'">'+esc(String(m.firstName||'')+' '+String(m.lastName||''))+'</option>').join('');
 if(list.some(m=>m.memberId===prev))select.value=prev;
}
async function openOwnerMember(){
 const id=document.getElementById('ownerMemberSelect').value,box=document.getElementById('ownerMemberDetail');
 if(!id){box.textContent='กรุณาเลือกสมาชิกก่อน';return}
 CURRENT_OWNER_PROFILE=null;box.textContent='กำลังโหลดข้อมูลสมาชิก...';
 try{
  const d=await call('getOwnerMemberProfile',{memberId:id});
  if(!d.ok){box.textContent=d.message||'Backend ยังไม่ได้รองรับข้อมูลสมาชิก Owner';return}
  CURRENT_OWNER_PROFILE=d;
  const m=d.member||{},p=d.data?.profile||{},summ=d.summary||{},cs=d.data?.contacts||[],bs=d.data?.beneficiaries||[];
  let displayedReturn=Number(summ.returnEstimate||0),returnNote='';
  try{
   const responses=await Promise.all([call('getReport',{from:'',to:''}),call('getPromos')]);
   const report=responses[0],promos=responses[1];
   if(report.ok&&promos.ok&&promos.published&&Array.isArray(promos.rules)){
    const mid=String(m.memberId||'').trim(),cid=String(m.citizenId||'').trim();
    const rows=(report.items||report.payments||[]).filter(x=>{
     const rowId=String(x.memberId||x.member_id||'').trim();
     const rowCid=String(x.citizenId||x.citizen_id||'').trim();
     return (mid&&rowId===mid)||(cid&&rowCid===cid);
    });
    if(rows.length){
     const results=rows.map(x=>ownerReportPromo(x,promos.rules));
     displayedReturn=results.reduce((sum,x)=>sum+x.value,0);
     returnNote=results.some(x=>x.estimated)?' (คำนวณตามโปร ยังไม่บันทึกในสลิป)':'';
     if(results.some(x=>x.conflict))returnNote+=' (มีโปรทับซ้อน ต้องตรวจสอบ)';
    }
   }
  }catch(e){console.warn('Owner member promotion calculation unavailable',e)}

  const field=(label,value)=>'<div style="padding:7px 0;border-bottom:1px solid #eee"><b>'+esc(label)+'</b>: '+esc(value||'—')+'</div>';
  const contact=cs.map((x,i)=>field('ผู้ติดต่อ '+(i+1),String(x.firstName||'')+' '+String(x.lastName||'')+' '+String(x.phone||''))).join('');
  const bene=bs.map((x,i)=>field('ผู้รับผลประโยชน์ '+(i+1),String(x.firstName||'')+' '+String(x.lastName||'')+' / '+String(x.percent||0)+'%')).join('');
  box.innerHTML='<article id="ownerMemberPrintable" style="padding:20px;border:1px solid #dfe7f2;border-radius:12px;background:white"><h2>T2Project — ข้อมูลสมาชิก</h2>'+
   field('ชื่อ-นามสกุล',String(m.firstName||'')+' '+String(m.lastName||''))+field('รหัสสมาชิก',m.memberId)+field('เลขบัตร',m.citizenId)+field('ชื่อห้อง',ownerRoomInfo(m)?.room||m.room||m.adminId)+field('แอดมินผู้ดูแล',ownerRoomInfo(m)?.name||'ยังไม่พบการจับคู่ห้อง')+field('สถานะเข้าโปรไฟล์',typeof OWNER_MEMBERS.find(x=>String(x.memberId)===String(m.memberId))?.profileVisited==='boolean'?(OWNER_MEMBERS.find(x=>String(x.memberId)===String(m.memberId)).profileVisited?'เข้าโปรไฟล์แล้ว':'ยังไม่พบประวัติการเข้า'):'รอข้อมูลจาก Backend')+
   field('เบอร์โทร',p.phone)+field('อีเมล',p.email)+field('ธนาคาร',p.bank)+field('บัญชีธนาคาร',p.bankAccount)+field('ที่อยู่',p.address)+field('แผนที่',p.mapUrl)+
   field('ยอดลงทุน',money(summ.investment))+field('จำนวนบิล',summ.billCount)+field('ผลตอบแทนตามโปร',money(displayedReturn)+returnNote)+
   '<h3>ผู้ติดต่อ</h3>'+contact+'<h3>ผู้รับผลประโยชน์</h3>'+bene+'</article>';
 }catch(e){box.textContent='โหลดข้อมูลสมาชิกไม่ได้ กรุณาตรวจการ Deploy Backend รอบ 5'}
}
function printOwnerMember(){
 const source=document.getElementById('ownerMemberPrintable');
 if(!source||!CURRENT_OWNER_PROFILE){alert('เปิดข้อมูลสมาชิกก่อน');return}
 const w=window.open('','_blank');
 if(!w){alert('กรุณาอนุญาตหน้าต่างพิมพ์');return}
 w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>T2Project Member</title><style>body{font:15px sans-serif;margin:15mm}h2{font-size:21px}@page{size:A4 portrait;margin:12mm}</style></head><body>'+source.innerHTML+'</body></html>');
 w.document.close();w.focus();w.print();
}

function ownerShowSection(which){
 const ids={overview:'ownerOverviewSection',admins:'ownerAdminSection',members:'ownerMembersSection',reports:'ownerReportsSection',statement:'ownerStatementSection',disputes:'ownerDisputesSection',promos:'ownerPromosSection'};
 Object.entries(ids).forEach(([key,id])=>document.getElementById(id).classList.toggle('hidden',key!==which));
 document.querySelectorAll('[data-owner-nav]').forEach(button=>{if(button.dataset.ownerNav===which)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
 if(which==='admins')ownerRenderAdmins();if(which==='disputes')ownerRenderDisputes();if(which==='promos')ownerLoadPromos();
}
function ownerAdminKey(m){return String(m.adminId||m.admin_id||m.roomId||m.room_id||'ไม่ระบุห้อง').trim()}
function ownerRenderAdmins(){
 const el=document.getElementById('ownerAdminSelect');if(!el)return;
 const q=document.getElementById('ownerAdminSearch').value.trim().toLocaleLowerCase('th-TH'),prev=el.value;
 const list=OWNER_ROOM_DIRECTORY.filter(x=>(x.room+' '+x.name+' '+x.code).toLocaleLowerCase('th-TH').includes(q));
 el.innerHTML='<option value="">เลือกแอดมิน / ห้อง</option>'+list.map(x=>'<option value="'+esc(x.room)+'">ห้อง '+esc(x.room)+' — '+esc(x.name)+'</option>').join('');
 if(list.some(x=>x.room===prev))el.value=prev;
 document.getElementById('ownerAdminCards').textContent='ทะเบียนห้องรับผิดชอบ '+list.length+' ห้อง (A+, A, B, C, D, E, F, G) — ข้อมูลแอดมินจากทะเบียนกลาง';
 if(el.value)ownerOpenAdmin();else document.getElementById('ownerAdminDetails').textContent='เลือกห้องเพื่อตรวจสอบ';
}
function ownerOpenAdmin(){
 const id=document.getElementById('ownerAdminSelect').value,box=document.getElementById('ownerAdminDetails');
 const admin=OWNER_ROOM_DIRECTORY.find(x=>x.room===id);
 if(!admin){box.textContent='กรุณาเลือกห้อง';return}
 const members=OWNER_MEMBERS.filter(m=>ownerRoomInfo(m)?.room===id);
 const citizens=new Set(members.map(m=>String(m.citizenId||m.citizen_id||m.documentId||'')).filter(Boolean));
 const payments=REPORT.filter(x=>citizens.has(String(x.citizenId||x.citizen_id||x.documentId||'')));
 const sum=payments.reduce((v,x)=>v+Number(x.amount||0),0);
 const accessKnown=members.every(m=>typeof m.profileVisited==='boolean');const entered=members.filter(m=>m.profileVisited===true).length;
 box.innerHTML='<h3>ห้อง '+esc(id)+' — '+esc(admin.name)+'</h3><p>รหัสผู้รับผิดชอบ '+esc(admin.code)+' · สมาชิก '+members.length.toLocaleString('th-TH')+' คน · เข้าโปรไฟล์ '+(accessKnown?entered+' คน / ยังไม่พบประวัติ '+(members.length-entered)+' คน':'รอ Backend')+' · สลิปในช่วงรายงาน '+payments.length.toLocaleString('th-TH')+' รายการ · ยอดเงิน '+money(sum)+'</p><p>รายชื่อสมาชิกและสลิปอ้างอิงข้อมูลที่โหลดได้ ไม่ใช่จำนวนบัญชีแอดมินที่เข้าใช้งานสำเร็จ</p><div class="tableWrap"><table><thead><tr><th>สมาชิก</th><th>รหัสสมาชิก</th><th>รายการสลิป</th><th>ยอด</th><th>ตรวจข้อมูล</th></tr></thead><tbody>'+members.map(m=>{const rs=payments.filter(x=>String(x.citizenId||x.citizen_id||'')===String(m.citizenId||m.citizen_id||m.documentId||''));const amount=rs.reduce((v,x)=>v+Number(x.amount||0),0);return '<tr><td>'+esc(String(m.firstName||'')+' '+String(m.lastName||''))+'</td><td>'+esc(m.memberId||'')+'</td><td>'+rs.length+'</td><td>'+money(amount)+'</td><td><button type="button" data-member-id="'+esc(m.memberId||'')+'" onclick="ownerInspectMember(this.dataset.memberId)">เปิดสมาชิก</button></td></tr>'}).join('')+'</tbody></table></div>';
}
function ownerInspectMember(id){
 ownerShowSection('members');document.getElementById('ownerMemberSearch').value=id;filterOwnerMembers();
 const el=document.getElementById('ownerMemberSelect');if(![...el.options].some(o=>o.value===id))filterOwnerMembers()
 el.value=id;openOwnerMember();
}
function ownerUpdatePage(){const e=document.getElementById('ownerPageLabel');if(e)e.textContent='หน้า '+(OWNER_REPORT_PAGE+1)+' / '+Math.max(1,Math.ceil(REPORT.length/50))}
function ownerPageChange(delta){
 const next=OWNER_REPORT_PAGE+delta;if(next<0||next>=Math.ceil(REPORT.length/50))return;
 OWNER_REPORT_PAGE=next;
 // Reuse cached data without another call to the backend.
 const rows=REPORT.slice(next*50,(next+1)*50);
 ownerRows.innerHTML=rows.map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||'')+' '+esc(x.transferTime||x.transfer_time||'')+'</td><td>'+esc(String(x.firstName||'')+' '+String(x.lastName||''))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.rulePeriod||x.rule_period||'')+'</td><td>'+money(x._ownerPromoDisplay?.value??x.promoReturn??x.promo_return??0)+(x._ownerPromoDisplay?.estimated?' *':'')+'</td><td>'+esc(x.reviewStatus||x.review_status||'pending')+'</td><td>'+esc(x.memberNote||x.member_note||'—')+'</td></tr>').join('');
 ownerUpdatePage();
}

/* Round 7 — temporary, local-only CSV statement reconciliation */
function ownerCsvRows(raw){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
 else if(c===','&&!quoted){row.push(cell);cell=''}
 else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&raw[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}
 else cell+=c}
 if(cell||row.length){row.push(cell);rows.push(row)}
 return rows
}
function ownerNormDate(s){
 let v=String(s||'').trim().replace(/^\uFEFF/,'');
 const m=v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
 if(m){let y=Number(m[3]);if(y>2400)y-=543;return String(y)+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
 const iso=v.match(/^(\d{4})-(\d\d)-(\d\d)/);
 if(iso){let y=Number(iso[1]);if(y>2400)y-=543;return String(y)+'-'+iso[2]+'-'+iso[3]}
 return ''
}
function ownerNormMoney(s){const n=Number(String(s??'').replace(/[฿,\s]/g,''));return Number.isFinite(n)?Math.round(n*100):NaN}
async function ownerReadStatement(file){
 const summary=document.getElementById('ownerStatementSummary'),body=document.getElementById('ownerStatementRows');
 if(!file){summary.textContent='กรุณาเลือกไฟล์';return}
 if(file.size>5*1024*1024){summary.textContent='ไฟล์ใหญ่เกิน 5 MB';return}
 try{
 const rows=ownerCsvRows(await file.text());
 if(rows.length<2)throw Error('ไม่พบข้อมูลใน CSV');
 const cols=rows[0].map(x=>x.toLowerCase().trim().replace(/^\uFEFF/,''));
 const find=(patterns)=>cols.findIndex(c=>patterns.some(p=>c.includes(p)));
 const dateI=find(['วันที่','date','transaction date']),amountI=find(['เงินเข้า','credit','amount','จำนวนเงิน','deposit']),refI=find(['อ้างอิง','reference','ref','เลขที่รายการ']);
 if(dateI<0||amountI<0)throw Error('ต้องมีหัวคอลัมน์วันที่และจำนวนเงิน/เงินเข้า กรุณาตรวจไฟล์ CSV');
 const slips=REPORT.map((x,i)=>({i,date:ownerNormDate(x.transferDate||x.transfer_date),amount:ownerNormMoney(x.amount),ref:String(x.referenceNo||x.reference_no||'').replace(/\D/g,'').slice(-6)}));
 const used=new Set();let matched=0,unmatched=0,ambiguous=0,invalid=0,bodyRows=[];
 for(const cells of rows.slice(1).filter(a=>a.some(x=>x.trim()))){
 const date=ownerNormDate(cells[dateI]),amount=ownerNormMoney(cells[amountI]),ref=refI>=0?String(cells[refI]||'').replace(/\D/g,'').slice(-6):'';
 if(!date||!Number.isFinite(amount)||amount<=0){invalid++;continue}
 let possibles=slips.filter(x=>!used.has(x.i)&&x.date===date&&x.amount===amount);
 if(ref.length===6)possibles=possibles.filter(x=>x.ref===ref);
 let status='';
 if(possibles.length===1){used.add(possibles[0].i);matched++;status='พบคู่ (รอตรวจหลักฐาน)'}
 else if(possibles.length>1){ambiguous++;status='อาจตรงหลายสลิป ต้องตรวจด้วยคน'}
 else{unmatched++;status='ไม่พบสลิปที่ตรงกัน — ตรวจสอบสลิปตกหล่น'}
 bodyRows.push('<tr><td>'+esc(date)+'</td><td>'+esc(String(cells[amountI]||''))+'</td><td>'+esc(ref||'—')+'</td><td>'+esc(status)+'</td></tr>');
 }
 summary.textContent='จับคู่เบื้องต้น '+matched+' · ไม่พบคู่ '+unmatched+' · อาจตรงหลายรายการ '+ambiguous+' · แถวที่ข้าม '+invalid+' · สลิปที่ยังไม่ถูกจับคู่ '+(slips.length-used.size)+' รายการ';
 body.innerHTML=bodyRows.slice(0,150).join('')||'<tr><td colspan="4">ไม่มีรายการ</td></tr>';
 if(bodyRows.length>150)summary.textContent+=' (แสดง 150 รายการแรก)';
 }catch(e){summary.textContent=e.message||'อ่าน CSV ไม่สำเร็จ';body.innerHTML=''}
}

function ownerRenderDisputes(){
 const summary=document.getElementById('ownerDisputesSummary'),body=document.getElementById('ownerDisputesRows');if(!summary||!body)return;
 const issues=REPORT.filter(x=>String(x.reviewStatus||x.review_status||x.memberStatus||'').toLowerCase()==='incorrect');
 summary.textContent='รายการที่สมาชิกแจ้งข้อมูลผิด '+issues.length+' รายการ (จากรายงานช่วงวันที่ที่โหลด)';
 const sample=issues.slice(0,100);
 body.innerHTML=sample.length?sample.map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||'—')+'</td><td>'+esc([x.firstName||x.first_name||'',x.lastName||x.last_name||''].join(' ').trim())+'</td><td>'+esc(x.referenceNo||x.reference_no||'—')+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.memberNote||x.member_note||'ไม่ได้ระบุรายละเอียด')+'</td><td>แจ้งข้อมูลผิด — รอตรวจสอบ</td></tr>').join(''):'<tr><td colspan="6">ไม่มีรายการแจ้งข้อมูลผิดในชุดข้อมูลนี้</td></tr>';
 if(issues.length>100)summary.textContent+=' (แสดง 100 รายการแรก)';
}

let OWNER_PROMOS=null,OWNER_PROMO_VERSION='',OWNER_PROMO_PUBLISHED=false;
async function ownerLoadPromos(){
 const box=document.getElementById('ownerPromoMessage');
 if(box)box.textContent='กำลังโหลดโปรจากฐานกลาง...';
 try{
  const data=await call('getPromos');
  if(!data.ok)throw Error(data.message||'Backend ยังไม่รองรับ getPromos — กรุณา Deploy Code.gs ใหม่');
  OWNER_PROMO_VERSION=data.version;
  OWNER_PROMO_PUBLISHED=!!data.published;
  if(data.published){
    OWNER_PROMOS=data.rules;
  }else{
    const r=await fetch('promo-rules-review.json?v=1',{cache:'no-store'});
    if(!r.ok)throw Error('โหลดกฎตั้งต้นไม่สำเร็จ');
    const seed=await r.json();
    OWNER_PROMOS=seed.rules;
    try{const draft=JSON.parse(localStorage.getItem('t2_owner_promo_drafts_v1')||'null');if(Array.isArray(draft))OWNER_PROMOS=draft}catch(e){}
  }
  ownerPromoReset();ownerRenderPromos();ownerPromoCalculate();
  if(!OWNER_PROMO_PUBLISHED&&box)box.textContent='ยังไม่ได้เผยแพร่โปรกลาง — ตรวจรายการ แล้วกด “เผยแพร่โปรไปฐานกลาง”';
 }catch(e){
  OWNER_PROMO_VERSION='';OWNER_PROMO_PUBLISHED=false;
  try{
   const r=await fetch('promo-rules-review.json?v=1',{cache:'no-store'});
   const seed=await r.json();OWNER_PROMOS=seed.rules||[];
   try{const draft=JSON.parse(localStorage.getItem('t2_owner_promo_drafts_v1')||'null');if(Array.isArray(draft))OWNER_PROMOS=draft}catch(ex){}
   ownerPromoReset();ownerRenderPromos();ownerPromoCalculate();
  }catch(ex){OWNER_PROMOS=null}
  if(box)box.textContent='ยังไม่เชื่อมโปรกลาง: '+String(e.message||e)+' | แสดงโปรเดิมเพื่อดูเท่านั้น กรุณา Deploy Backend ก่อนบันทึก';
 }
}
function ownerRenderPromos(){
 if(!OWNER_PROMOS)return;
 const search=String(document.getElementById('ownerPromoSearch')?.value||'').trim().toLowerCase();
 const filter=document.getElementById('ownerPromoFilter')?.value||'all';
 const overlaps=new Set();
 for(let i=0;i<OWNER_PROMOS.length;i++)for(let j=i+1;j<OWNER_PROMOS.length;j++){
 const a=OWNER_PROMOS[i],b=OWNER_PROMOS[j];if(a.from<=b.to&&b.from<=a.to){overlaps.add(a.n);overlaps.add(b.n)}
 }
 const rows=OWNER_PROMOS.filter(x=>(filter==='all'||(filter==='review'&&overlaps.has(x.n))||(filter==='exact'&&x.exactOnly))&&(!search||String(x.n).includes(search)||x.from.includes(search)||x.to.includes(search)));
 document.getElementById('ownerPromoMessage').textContent='กฎโปร '+OWNER_PROMOS.length+' ช่วง • วันทับซ้อน '+overlaps.size+' ช่วง • แสดง '+rows.length+' ช่วง • '+(OWNER_PROMO_PUBLISHED?'ฐานกลางเผยแพร่แล้ว':'ชุดตั้งต้นยังไม่เผยแพร่');
 document.getElementById('ownerPromoList').innerHTML=rows.map(x=>'<article class="ownerPromoCard"><div class="ownerPromoHead"><strong>'+esc(x.name||('โปรช่วงที่ '+x.n))+'</strong><span>'+esc(x.from)+' ถึง '+esc(x.to)+'</span></div><div class="ownerPromoMeta">'+(overlaps.has(x.n)?'<span>⚠ วันทับซ้อน</span>':'')+(x.exactOnly?'<span>ยอดตามรายการเท่านั้น</span>':'<span>มีกฎอัตราส่วนเดิมที่ต้องตรวจ</span>')+'</div><div class="tableWrap"><table><thead><tr><th>ยอดลงทุน</th><th>ผลตอบแทนตามโปร (ยังไม่ใช่รับจริง)</th></tr></thead><tbody>'+x.tiers.map(t=>'<tr><td>'+money(t[0])+'</td><td>'+money(t[1])+'</td></tr>').join('')+'</tbody></table></div><div class="ownerPromoActions"><button type="button" onclick="ownerPromoEdit('+Number(x.n)+')">แก้ไข</button><button type="button" class="ownerPromoDelete" onclick="ownerPromoDelete('+Number(x.n)+')">ลบ</button></div></article>').join('')||'<p>ไม่พบช่วงโปรที่ค้นหา</p>';
}

let OWNER_PROMO_EDIT_ID=null;
async function ownerPromoPersist(next){
 const status=document.getElementById('ownerPromoEditStatus');
 if(!OWNER_PROMO_VERSION){if(status)status.textContent='ยังไม่เชื่อมฐานกลาง กรุณา Deploy Backend แล้วโหลดใหม่';return false}
 try{
  if(status)status.textContent='กำลังบันทึกโปรลงฐานกลาง...';
  const result=await call('savePromos',{rules:next,expectedVersion:OWNER_PROMO_VERSION});
  if(!result.ok)throw Error(result.message||'บันทึกไม่สำเร็จ');
  OWNER_PROMOS=result.rules;OWNER_PROMO_VERSION=result.version;OWNER_PROMO_PUBLISHED=true;
  localStorage.removeItem('t2_owner_promo_drafts_v1');
  ownerRenderPromos();ownerPromoCalculate();
  if(status)status.textContent='บันทึกโปรลงฐานกลางสำเร็จ • Admin และ Member อ่านเงื่อนไขนี้ได้';
  return true;
 }catch(e){if(status)status.textContent='บันทึกไม่สำเร็จ: '+String(e.message||e)+' — ยังไม่เปลี่ยนข้อมูลบนฐานกลาง';alert('บันทึกโปรไม่สำเร็จ: '+String(e.message||e));return false}
}
function ownerPromoReset(){
 OWNER_PROMO_EDIT_ID=null;
 for(const id of ['promoEditName','promoEditFrom','promoEditTo']){const e=document.getElementById(id);if(e)e.value=''}
 const el=document.getElementById('promoEditTiers');if(el){el.innerHTML='';ownerPromoAddTier()}
}
function ownerPromoAddTier(paid='',receive=''){
 const box=document.getElementById('promoEditTiers');if(!box)return;
 const row=document.createElement('div');row.className='ownerPromoTier';
 row.innerHTML='<label>ยอดลงทุน (บาท)<input type="number" class="promoTierPaid" min="0.01" step="0.01" placeholder="จำนวนเงินลงทุน"></label><label>ยอดที่จะได้รับ (บาท)<input type="number" class="promoTierReceive" min="0" step="0.01" placeholder="จำนวนเงินตามโปร"></label><button type="button" onclick="this.closest(\'.ownerPromoTier\').remove()">ลบอัตรา</button>';
 row.querySelector('.promoTierPaid').value=paid;
 row.querySelector('.promoTierReceive').value=receive;
 box.appendChild(row)
}
function ownerPromoEdit(id){
 const x=OWNER_PROMOS?.find(z=>z.n===id);if(!x)return;
 OWNER_PROMO_EDIT_ID=id;document.getElementById('promoEditName').value=x.name||'โปรช่วงที่ '+x.n;
 document.getElementById('promoEditFrom').value=x.from;document.getElementById('promoEditTo').value=x.to;
 const box=document.getElementById('promoEditTiers');box.innerHTML='';
 x.tiers.forEach(t=>ownerPromoAddTier(t[0],t[1]));
 document.querySelector('.ownerPromoEditor')?.scrollIntoView({behavior:'smooth',block:'start'})
}
async function ownerPromoSave(){
 if(!OWNER_PROMOS)return;
 const from=document.getElementById('promoEditFrom').value,to=document.getElementById('promoEditTo').value;
 const name=document.getElementById('promoEditName').value.trim();
 const tiers=[...document.querySelectorAll('.ownerPromoTier')].map(row=>[Number(row.querySelector('.promoTierPaid').value),Number(row.querySelector('.promoTierReceive').value)]);
 const valid=tiers.length&&tiers.every((x,i)=>x[0]>0&&x[1]>=0&&Number.isFinite(x[1])&&!tiers.some((y,j)=>i!==j&&x[0]===y[0]));
 const msg=document.getElementById('ownerPromoEditStatus');
 if(!name){msg.textContent='กรุณากรอกชื่อโปร';document.getElementById('promoEditName').focus();return}
 if(!from||!to){msg.textContent='วันที่ไม่ถูกต้องหรือยังกรอกไม่ครบ กรุณาเลือกวันที่จากปฏิทิน';document.getElementById(!from?'promoEditFrom':'promoEditTo').focus();return}
 if(from>to){msg.textContent='วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น';document.getElementById('promoEditTo').focus();return}
 if(!valid||[...document.querySelectorAll('.ownerPromoTier input')].some(x=>x.value.trim()==='')){msg.textContent='กรุณากรอกยอดลงทุนและยอดที่จะได้รับให้ครบ (ยอดลงทุนในโปรเดียวกันห้ามซ้ำ)';return}
 const id=OWNER_PROMO_EDIT_ID??Math.max(0,...OWNER_PROMOS.map(x=>Number(x.n)||0))+1;
 const ratios=tiers.map(t=>t[1]/t[0]);
 const proportional=ratios.every(v=>Math.abs(v-ratios[0])<=1e-8*Math.max(1,Math.abs(ratios[0])));
 const obj={n:id,name,from,to,tiers,exactOnly:!proportional};
 const next=OWNER_PROMOS.slice(),index=next.findIndex(x=>x.n===id);if(index>=0)next[index]=obj;else next.push(obj);
 if(await ownerPromoPersist(next))ownerPromoReset();
}
async function ownerPromoDelete(id){
 const x=OWNER_PROMOS?.find(z=>z.n===id);if(!x||!confirm('ยืนยันลบ '+(x.name||'โปรช่วง '+id)+' ออกจากฉบับร่างในเครื่องนี้?'))return;
 const next=OWNER_PROMOS.filter(z=>z.n!==id);if(await ownerPromoPersist(next)&&OWNER_PROMO_EDIT_ID===id)ownerPromoReset();
}
function ownerPromoExport(){
 if(!OWNER_PROMOS)return;
 const blob=new Blob([JSON.stringify({version:1,rules:OWNER_PROMOS},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='T2PROJECT_owner_promo_draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
async function ownerPromoImport(file){
 if(!file)return;if(file.size>2*1024*1024){alert('ไฟล์ใหญ่เกิน 2 MB');return}
 try{const obj=JSON.parse(await file.text());if(!Array.isArray(obj.rules)||obj.rules.length>10000)throw Error('ข้อมูลไม่ถูกต้อง');
 const seen=new Set();
 for(const x of obj.rules){if(!Number.isSafeInteger(x.n)||seen.has(x.n)||!/^\d{4}-\d\d-\d\d$/.test(x.from)||!/^\d{4}-\d\d-\d\d$/.test(x.to)||x.from>x.to||!Array.isArray(x.tiers)||!x.tiers.length||x.tiers.some(t=>!Array.isArray(t)||t.length!==2||!Number.isFinite(t[0])||t[0]<=0||!Number.isFinite(t[1])||t[1]<0))throw Error('พบข้อมูลโปรไม่ถูกต้อง');seen.add(x.n)}
 if(!confirm('แทนที่ฉบับร่างปัจจุบันด้วยข้อมูล '+obj.rules.length+' โปร?'))return;
 if(await ownerPromoPersist(obj.rules))ownerPromoReset();
 }catch(e){alert('นำเข้าไม่ได้: '+e.message)}
}

function ownerPromoCompute(rules,date,amount){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))||!Number.isFinite(amount)||amount<=0)return {status:'invalid',matches:[]};
 const candidates=(rules||[]).filter(r=>r.from<=date&&date<=r.to);
 const matches=candidates.map(r=>{const tiers=(r.tiers||[]).slice().sort((a,b)=>a[0]-b[0]);const level=tiers.filter(t=>amount>=t[0]).pop()||tiers[0];return level?{n:r.n,name:r.name||'โปรช่วงที่ '+r.n,receive:Math.round(amount*level[1]/level[0]*100)/100,rateType:level===tiers[0]?'อัตราปกติ':'อัตราพิเศษ'}:null}).filter(Boolean);
 if(!candidates.length)return {status:'none',matches:[]};
 if(!matches.length)return {status:'review',matches:[]};
 if(new Set(matches.map(x=>x.receive)).size>1)return {status:'conflict',matches};
 return {status:'matched',receive:matches[0].receive,matches};
}
function ownerPromoCalculate(){
 const box=document.getElementById('ownerCalcResult');if(!box)return;
 const date=document.getElementById('ownerCalcDate')?.value,amount=Number(document.getElementById('ownerCalcAmount')?.value);
 if(!date||!amount){box.textContent='กรอกวันที่โอนและยอดลงทุนเพื่อคำนวณ';return}
 const out=ownerPromoCompute(OWNER_PROMOS||[],date,amount);
 if(out.status==='matched')box.textContent='ยอดที่จะได้รับตามโปร '+money(out.receive)+' | '+out.matches.map(x=>x.name).join(', ')+' (ไม่ใช่เงินที่ได้รับจริง)';
 else if(out.status==='conflict')box.textContent='โปรทับซ้อนและให้ผลต่างกัน — ต้องตรวจสอบ: '+out.matches.map(x=>x.name+' → '+money(x.receive)).join(' / ');
 else if(out.status==='none')box.textContent='ไม่พบโปรในวันที่นี้';
 else if(out.status==='review')box.textContent='วันที่อยู่ในช่วงโปร แต่ยอดลงทุนนี้ไม่มีอัตราที่กำหนดไว้ ต้องตรวจสอบก่อน';
 else box.textContent='กรอกวันที่และยอดลงทุนที่ถูกต้อง';
}

async function ownerPromoPublishAll(){
 if(!OWNER_PROMOS||!OWNER_PROMO_VERSION){alert('ยังเชื่อมฐานโปรกลางไม่ได้');return}
 if(!confirm('เผยแพร่โปร '+OWNER_PROMOS.length+' ช่วง ไปฐานข้อมูลกลาง เพื่อให้ Admin และ Member คำนวณจากชุดนี้? โปรเก่ายังรอตรวจเอกสารต้นฉบับ'))return;
 await ownerPromoPersist(OWNER_PROMOS);
}
