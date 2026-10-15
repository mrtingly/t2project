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
async function loadOwnerReport(){ownerRows.innerHTML='<tr><td colspan="7">กำลังโหลดข้อมูล...</td></tr>';try{const d=await call('getReport',{from:oFrom.value,to:oTo.value});if(!d.ok){ownerRows.innerHTML='<tr><td colspan="7">โหลด Report ไม่สำเร็จ</td></tr>';return}REPORT=d.items||d.payments||[];OWNER_REPORT_PAGE=0;const s=d.summary||{},statuses=REPORT.map(x=>String(x.reviewStatus||x.review_status||x.memberStatus||'pending').toLowerCase());oCount.textContent=(s.paymentCount??REPORT.length).toLocaleString('th-TH');oMembers.textContent=(s.memberCount??new Set(REPORT.map(x=>x.citizenId||x.citizen_id)).size).toLocaleString('th-TH');oAmount.textContent=money(s.totalAmount??REPORT.reduce((a,x)=>a+Number(x.amount||0),0));oReturn.textContent=money(s.totalPromo??s.totalPromoReturn??s.totalReturn??REPORT.reduce((a,x)=>a+Number(x.promoReturn||x.promo_return||x.reward||0),0));oConfirmed.textContent=(s.confirmedCount??statuses.filter(x=>x==='confirmed').length).toLocaleString('th-TH');oIncorrect.textContent=(s.incorrectCount??statuses.filter(x=>x==='incorrect').length).toLocaleString('th-TH');oPending.textContent=(s.pendingCount??statuses.filter(x=>!['confirmed','incorrect'].includes(x)).length).toLocaleString('th-TH');oRangeLabel.textContent=(oFrom.value||oTo.value)?(oFrom.value||'เริ่มต้น')+' ถึง '+(oTo.value||'ปัจจุบัน'):'ทุกช่วงเวลา';ownerRows.innerHTML=REPORT.length?REPORT.slice(OWNER_REPORT_PAGE*50,(OWNER_REPORT_PAGE+1)*50).map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||x.date||'')+' '+esc(x.transferTime||x.transfer_time||x.time||'')+'</td><td>'+esc(x.firstName?x.firstName+' '+x.lastName:(x.member||''))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.rulePeriod||x.rule_period||x.period||'')+'</td><td>'+money(x.promoReturn||x.promo_return||x.reward||0)+'</td><td><span class="statusPill">'+esc(x.reviewStatus||x.review_status||x.memberStatus||'pending')+'</span></td><td>'+esc(x.memberNote||x.member_note||'—')+'</td></tr>').join('') :'<tr><td colspan="7">ยังไม่มีรายการในช่วงนี้</td></tr>';ownerUpdatePage();ownerRenderDisputes()}catch(e){ownerRows.innerHTML='<tr><td colspan="7">เชื่อมต่อระบบไม่ได้</td></tr>'}}
function ownerCSV(){if(!REPORT.length){alert('ไม่มีข้อมูลสำหรับ Export');return}const rows=[['วันที่','เวลา','สมาชิก','ยอด','ช่วง','ผลตอบแทน','สถานะสมาชิก','หมายเหตุ'],...REPORT.map(x=>[x.transferDate||x.transfer_date||x.date||'',x.transferTime||x.transfer_time||x.time||'',(x.firstName||'')+' '+(x.lastName||''),x.amount||0,x.rulePeriod||x.rule_period||x.period||'',x.promoReturn||x.promo_return||x.reward||'',x.reviewStatus||x.review_status||'',x.memberNote||x.member_note||''])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='T2Project-Owner-Report-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href)}
async function ownerLogout(){try{await call('staffLogout')}catch(e){}sessionStorage.removeItem('t2_owner');location.reload()}ownerPass.addEventListener('keydown',e=>{if(e.key==='Enter')ownerLogin()});boot();
function toggleOwnerPassword(){const p=document.getElementById('ownerPass'),b=document.querySelector('.passwordToggle');const show=p.type==='password';p.type=show?'text':'password';if(b)b.textContent=show?'ซ่อน':'ดู'}

let OWNER_MEMBERS=[],CURRENT_OWNER_PROFILE=null,OWNER_REPORT_PAGE=0;
async function loadOwnerMembers(){
 try{
  const d=await call('getMyMembers');
  if(!d.ok)return;
  OWNER_MEMBERS=d.items||d.members||[];
  filterOwnerMembers();ownerRenderAdmins();
 }catch(e){document.getElementById('ownerMemberDetail').textContent='ยังโหลดรายชื่อสมาชิกไม่ได้'}
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
  const field=(label,value)=>'<div style="padding:7px 0;border-bottom:1px solid #eee"><b>'+esc(label)+'</b>: '+esc(value||'—')+'</div>';
  const contact=cs.map((x,i)=>field('ผู้ติดต่อ '+(i+1),String(x.firstName||'')+' '+String(x.lastName||'')+' '+String(x.phone||''))).join('');
  const bene=bs.map((x,i)=>field('ผู้รับผลประโยชน์ '+(i+1),String(x.firstName||'')+' '+String(x.lastName||'')+' / '+String(x.percent||0)+'%')).join('');
  box.innerHTML='<article id="ownerMemberPrintable" style="padding:20px;border:1px solid #dfe7f2;border-radius:12px;background:white"><h2>T2Project — ข้อมูลสมาชิก</h2>'+
   field('ชื่อ-นามสกุล',String(m.firstName||'')+' '+String(m.lastName||''))+field('รหัสสมาชิก',m.memberId)+field('เลขบัตร',m.citizenId)+field('ห้อง',m.adminId)+
   field('เบอร์โทร',p.phone)+field('อีเมล',p.email)+field('ธนาคาร',p.bank)+field('บัญชีธนาคาร',p.bankAccount)+field('ที่อยู่',p.address)+field('แผนที่',p.mapUrl)+
   field('ยอดลงทุน',money(summ.investment))+field('จำนวนบิล',summ.billCount)+field('ผลตอบแทนตามโปร',money(summ.returnEstimate))+
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
 const q=document.getElementById('ownerAdminSearch').value.trim().toLowerCase(),prev=el.value;
 const ids=[...new Set(OWNER_MEMBERS.map(ownerAdminKey))].filter(x=>x.toLowerCase().includes(q)).sort();
 el.innerHTML='<option value="">เลือกแอดมิน / ห้อง</option>'+ids.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
 if(ids.includes(prev))el.value=prev;
 document.getElementById('ownerAdminCards').textContent='พบ '+ids.length+' ห้อง / กลุ่มรับผิดชอบ (ใช้ข้อมูลรหัสห้องในทะเบียนสมาชิก)';
 if(el.value)ownerOpenAdmin();else document.getElementById('ownerAdminDetails').textContent='เลือกห้องเพื่อตรวจสอบ';
}
function ownerOpenAdmin(){
 const id=document.getElementById('ownerAdminSelect').value,box=document.getElementById('ownerAdminDetails');
 if(!id){box.textContent='กรุณาเลือกห้อง';return}
 const members=OWNER_MEMBERS.filter(m=>ownerAdminKey(m)===id);
 const citizens=new Set(members.map(m=>String(m.citizenId||m.citizen_id||m.documentId||'')).filter(Boolean));
 const payments=REPORT.filter(x=>citizens.has(String(x.citizenId||x.citizen_id||x.documentId||'')));
 const sum=payments.reduce((v,x)=>v+Number(x.amount||0),0);
 box.innerHTML='<h3>ห้อง '+esc(id)+'</h3><p>สมาชิก '+members.length.toLocaleString('th-TH')+' คน · สลิปในช่วงรายงาน '+payments.length.toLocaleString('th-TH')+' รายการ · ยอดเงิน '+money(sum)+'</p><p>ยอดสลิปอ้างอิงช่วงวันที่ในหน้ารายงาน หากไม่พบสลิปไม่ได้แปลว่าไม่มีธุรกรรม</p><div class="tableWrap"><table><thead><tr><th>สมาชิก</th><th>รหัสสมาชิก</th><th>รายการสลิป</th><th>ยอด</th><th>ตรวจข้อมูล</th></tr></thead><tbody>'+members.map(m=>{const rs=payments.filter(x=>String(x.citizenId||x.citizen_id||'')===String(m.citizenId||m.citizen_id||m.documentId||''));const amount=rs.reduce((v,x)=>v+Number(x.amount||0),0);return '<tr><td>'+esc(String(m.firstName||'')+' '+String(m.lastName||''))+'</td><td>'+esc(m.memberId||'')+'</td><td>'+rs.length+'</td><td>'+money(amount)+'</td><td><button type="button" data-member-id="'+esc(m.memberId||'')+'" onclick="ownerInspectMember(this.dataset.memberId)">เปิดสมาชิก</button></td></tr>'}).join('')+'</tbody></table></div>';
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
 ownerRows.innerHTML=rows.map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||'')+' '+esc(x.transferTime||x.transfer_time||'')+'</td><td>'+esc(String(x.firstName||'')+' '+String(x.lastName||''))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.rulePeriod||x.rule_period||'')+'</td><td>'+money(x.promoReturn||x.promo_return||0)+'</td><td>'+esc(x.reviewStatus||x.review_status||'pending')+'</td><td>'+esc(x.memberNote||x.member_note||'—')+'</td></tr>').join('');
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

let OWNER_PROMOS=null;
async function ownerLoadPromos(){
 const box=document.getElementById('ownerPromoMessage');
 if(OWNER_PROMOS){ownerRenderPromos();return}
 if(box)box.textContent='กำลังโหลดเงื่อนไขโปรตัวเงินที่ระบบใช้อยู่...';
 try{
  const r=await fetch('promo-rules-review.json?v=1',{cache:'no-store'});
  if(!r.ok)throw new Error('ไม่สามารถโหลดตารางโปรได้');
  const data=await r.json();
  if(!Array.isArray(data.rules))throw new Error('รูปแบบข้อมูลโปรไม่ถูกต้อง');
  OWNER_PROMOS=data.rules;
  ownerRenderPromos();
 }catch(e){if(box)box.textContent=e.message||'โหลดโปรไม่สำเร็จ'}
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
 document.getElementById('ownerPromoMessage').textContent='กฎโปรที่มีอยู่ '+OWNER_PROMOS.length+' ช่วง • ช่วงที่วันที่ทับซ้อน '+overlaps.size+' ช่วง • แสดง '+rows.length+' ช่วง | ยังรอตรวจเอกสารต้นฉบับ';
 document.getElementById('ownerPromoList').innerHTML=rows.map(x=>'<article class="ownerPromoCard"><div class="ownerPromoHead"><strong>โปรช่วงที่ '+esc(x.n)+'</strong><span>'+esc(x.from)+' ถึง '+esc(x.to)+'</span></div><div class="ownerPromoMeta">'+(overlaps.has(x.n)?'<span>⚠ วันทับซ้อน</span>':'')+(x.exactOnly?'<span>ยอดตามรายการเท่านั้น</span>':'<span>มีกฎอัตราส่วนเดิมที่ต้องตรวจ</span>')+'</div><div class="tableWrap"><table><thead><tr><th>ยอดลงทุน</th><th>ผลตอบแทนตามโปร (ยังไม่ใช่รับจริง)</th></tr></thead><tbody>'+x.tiers.map(t=>'<tr><td>'+money(t[0])+'</td><td>'+money(t[1])+'</td></tr>').join('')+'</tbody></table></div></article>').join('')||'<p>ไม่พบช่วงโปรที่ค้นหา</p>';
}
