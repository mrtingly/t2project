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
async function loadOwnerReport(){ownerRows.innerHTML='<tr><td colspan="7">กำลังโหลดข้อมูล...</td></tr>';try{const d=await call('getReport',{from:oFrom.value,to:oTo.value});if(!d.ok){ownerRows.innerHTML='<tr><td colspan="7">โหลด Report ไม่สำเร็จ</td></tr>';return}REPORT=d.items||d.payments||[];const s=d.summary||{},statuses=REPORT.map(x=>String(x.reviewStatus||x.review_status||x.memberStatus||'pending').toLowerCase());oCount.textContent=(s.paymentCount??REPORT.length).toLocaleString('th-TH');oMembers.textContent=(s.memberCount??new Set(REPORT.map(x=>x.citizenId||x.citizen_id)).size).toLocaleString('th-TH');oAmount.textContent=money(s.totalAmount??REPORT.reduce((a,x)=>a+Number(x.amount||0),0));oReturn.textContent=money(s.totalPromo??s.totalPromoReturn??s.totalReturn??REPORT.reduce((a,x)=>a+Number(x.promoReturn||x.promo_return||x.reward||0),0));oConfirmed.textContent=(s.confirmedCount??statuses.filter(x=>x==='confirmed').length).toLocaleString('th-TH');oIncorrect.textContent=(s.incorrectCount??statuses.filter(x=>x==='incorrect').length).toLocaleString('th-TH');oPending.textContent=(s.pendingCount??statuses.filter(x=>!['confirmed','incorrect'].includes(x)).length).toLocaleString('th-TH');oRangeLabel.textContent=(oFrom.value||oTo.value)?(oFrom.value||'เริ่มต้น')+' ถึง '+(oTo.value||'ปัจจุบัน'):'ทุกช่วงเวลา';ownerRows.innerHTML=REPORT.length?REPORT.map(x=>'<tr><td>'+esc(x.transferDate||x.transfer_date||x.date||'')+' '+esc(x.transferTime||x.transfer_time||x.time||'')+'</td><td>'+esc(x.firstName?x.firstName+' '+x.lastName:(x.member||''))+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.rulePeriod||x.rule_period||x.period||'')+'</td><td>'+money(x.promoReturn||x.promo_return||x.reward||0)+'</td><td><span class="statusPill">'+esc(x.reviewStatus||x.review_status||x.memberStatus||'pending')+'</span></td><td>'+esc(x.memberNote||x.member_note||'—')+'</td></tr>').join(''):'<tr><td colspan="7">ยังไม่มีรายการในช่วงนี้</td></tr>'}catch(e){ownerRows.innerHTML='<tr><td colspan="7">เชื่อมต่อระบบไม่ได้</td></tr>'}}
function ownerCSV(){if(!REPORT.length){alert('ไม่มีข้อมูลสำหรับ Export');return}const rows=[['วันที่','เวลา','สมาชิก','ยอด','ช่วง','ผลตอบแทน','สถานะสมาชิก','หมายเหตุ'],...REPORT.map(x=>[x.transferDate||x.transfer_date||x.date||'',x.transferTime||x.transfer_time||x.time||'',(x.firstName||'')+' '+(x.lastName||''),x.amount||0,x.rulePeriod||x.rule_period||x.period||'',x.promoReturn||x.promo_return||x.reward||'',x.reviewStatus||x.review_status||'',x.memberNote||x.member_note||''])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='T2Project-Owner-Report-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href)}
async function ownerLogout(){try{await call('staffLogout')}catch(e){}sessionStorage.removeItem('t2_owner');location.reload()}ownerPass.addEventListener('keydown',e=>{if(e.key==='Enter')ownerLogin()});boot();
function toggleOwnerPassword(){const p=document.getElementById('ownerPass'),b=document.querySelector('.passwordToggle');const show=p.type==='password';p.type=show?'text':'password';if(b)b.textContent=show?'ซ่อน':'ดู'}

let OWNER_MEMBERS=[],CURRENT_OWNER_PROFILE=null;
async function loadOwnerMembers(){
 try{
  const d=await call('getMyMembers');
  if(!d.ok)return;
  OWNER_MEMBERS=d.items||d.members||[];
  filterOwnerMembers();
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
