// Monetary-only reward rules transcribed from the supplied T2 PDF.
// Non-cash rewards/items are intentionally excluded.
// A null result means the PDF does not provide a sufficiently clear monetary mapping.
const MONEY_RULES=[
 {n:1,from:"2025-03-11",to:"2025-03-11",tiers:[[100,50000]]},
 {n:2,from:"2025-03-13",to:"2025-04-17",tiers:[[100,150000]]},
 {n:3,from:"2025-04-18",to:"2025-04-27",tiers:[[100,100000]]},
 {n:4,from:"2025-04-28",to:"2025-05-27",tiers:[[100,30000]]},
 {n:5,from:"2025-05-28",to:"2025-06-21",tiers:[[100,200000]]},
 {n:6,from:"2025-06-22",to:"2025-07-06",tiers:[[100,250000]]},
 {n:7,from:"2025-07-07",to:"2025-07-30",tiers:[[100,500000]]},
 {n:8,from:"2025-07-31",to:"2025-08-11",tiers:[[100,600000]]},
 {n:9,from:"2025-08-12",to:"2025-08-13",tiers:[[100,800000]]},
 {n:10,from:"2025-08-14",to:"2025-08-21",tiers:[[100,100000]]},
 {n:11,from:"2025-08-22",to:"2025-09-18",tiers:[[100,2000000]]},
 {n:12,from:"2025-09-19",to:"2025-09-25",tiers:[[100,3000000]]},
 {n:13,from:"2025-09-26",to:"2025-10-08",tiers:[[100,4000000]]},
 {n:14,from:"2025-10-17",to:"2025-10-25",tiers:[[100,5000000]]},
 {n:15,from:"2025-10-27",to:"2025-11-10",tiers:[[100,5000000],[400,20000000]]},
 {n:16,from:"2025-10-27",to:"2025-11-10",tiers:[[500,25000000],[900,45000000]]},
 {n:17,from:"2025-10-27",to:"2025-11-10",tiers:[[1000,50000000]]},
 {n:18,from:"2025-10-27",to:"2025-11-10",tiers:[[10000,500000000]]},
 {n:23,from:"2026-02-16",to:"2026-03-10",tiers:[[100,1000000]]},
 {n:24,from:"2026-03-11",to:"2026-03-16",tiers:[[500,20000000]]},
 {n:25,from:"2026-03-17",to:"2026-03-19",tiers:[[100,4000000],[400,16000000],[500,40000000]]},
 {n:26,from:"2026-03-19",to:"2026-03-31",tiers:[[100,1000000],[400,4000000],[500,20000000]]},
 {n:27,from:"2026-03-31",to:"2026-04-05",tiers:[[100,1000000],[400,4000000],[500,20000000],[1000,40000000],[2000,80000000]]},
 {n:28,from:"2026-04-06",to:"2026-04-21",tiers:[[100,1000000],[500,5000000],[1000,20000000],[2000,40000000]]},
 {n:34,from:"2026-06-09",to:"2026-06-12",tiers:[[300,30000],[10000,100000]]},
 {n:35,from:"2026-06-22",to:"2026-06-27",tiers:[[100,50000],[200,100000],[300,150000]]},
 {n:36,from:"2026-07-03",to:"2026-07-10",tiers:[[100,1000000],[200,2000000],[300,3000000],[10000,10000000]]},
 {n:37,from:"2026-07-22",to:"2026-08-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},
 {n:38,from:"2026-08-18",to:"2026-08-20",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},
 {n:39,from:"2026-09-01",to:"2026-09-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,202000000]]},
 {n:40,from:"2026-09-18",to:"2026-09-23",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,502000000]]}
];
function rulesForDate(d){return MONEY_RULES.filter(x=>d>=x.from&&d<=x.to)}
function calculateMoney(d,a){const rs=rulesForDate(d);if(!rs.length)return {status:"none"};let matches=[];for(const r of rs){for(const [paid,receive] of r.tiers){if(a===paid)matches.push({period:r.n,paid,receive})}}return matches.length?{status:"matched",matches}:{status:"review",periods:rs.map(x=>x.n)}}


const API_URL='https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';
let selectedMember=null,lastReport=[];
const staff=JSON.parse(sessionStorage.getItem('t2_staff')||'null');
async function api(action,data={}){const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:staff&&staff.token,...data})});return r.json()}
async function guard(){if(!staff||!staff.token){location.href='admin-login.html';return}try{const x=await api('checkSession');if(!x.ok||!['admin','owner'].includes(x.role)){sessionStorage.removeItem('t2_staff');location.href='admin-login.html';return}renderReport()}catch(e){document.body.innerHTML='<div class="warn">เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่</div>'}}
function cleanName(v){return String(v||'').trim().replace(/^(นาย|นางสาว|นาง|น\.ส\.|น\.ส)\s*/,'').replace(/\s+/g,' ')}
async function findMember(){const id=aCitizen.value.replace(/\D/g,''),name=cleanName(aName.value);findResult.innerHTML='<div class="info">กำลังค้นหา Master...</div>';try{const d=await api('findMember',{citizenId:id,fullName:name});if(d.ok&&d.member){selectedMember={citizenId:id,firstName:d.member.firstName,lastName:d.member.lastName};findResult.innerHTML='<div class="saveOk">✓ พบสมาชิก: <b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b></div>'}else{selectedMember=null;findResult.innerHTML='<div class="warn">ไม่พบข้อมูลสมาชิกที่ตรงกัน</div>'}selectedMemberBox()}catch(e){findResult.innerHTML='<div class="warn">เชื่อมต่อฐานสมาชิกไม่ได้</div>'}}
function selectedMemberBox(){document.getElementById('selectedMember').innerHTML=selectedMember?'สมาชิกที่เลือก: <b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b>':'กรุณาค้นหาและเลือกสมาชิกก่อนลงรายการ'}
function paymentData(){const a=Number(amount.value),d=payDate.value,t=payTime.value,r=reference.value.trim(),c=calculateMoney(d,a),match=c.status==='matched'?c.matches[0]:null;return {amount:a,transferDate:d,transferTime:t,referenceNo:r,notes:note.value.trim(),bankVerified:bankVerified.checked,rulePeriod:match?match.period:'ตรวจสอบ',promoReturn:match?match.receive:''}}
function previewPayment(){if(!selectedMember){paymentResult.innerHTML='<div class="warn">กรุณาค้นหาสมาชิกก่อน</div>';return}const p=paymentData();if(!p.amount||!p.transferDate||!p.transferTime||!p.referenceNo){paymentResult.innerHTML='<div class="warn">กรุณากรอกยอด วันที่ เวลา และเลขอ้างอิง</div>';return}const c=calculateMoney(p.transferDate,p.amount);let s=c.status==='matched'?c.matches.map(x=>'ช่วง '+x.period+' • '+x.receive.toLocaleString('th-TH')+' บาท').join('<br>'):c.status==='none'?'ไม่พบช่วงเงินใน PDF':'ต้องตรวจสอบกฎช่วง '+c.periods.join(', ');paymentResult.innerHTML='<div class="'+(p.bankVerified?'info':'warn')+'"><b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b><br>'+p.amount.toLocaleString('th-TH')+' บาท • '+p.transferDate+' '+p.transferTime+'<br>'+s+'<br>'+(p.bankVerified?'✓ ยืนยันเงินเข้าแล้ว':'ยังไม่ยืนยันเงินเข้า')+'</div>'}
async function savePayment(){if(!selectedMember){paymentResult.innerHTML='<div class="warn">กรุณาค้นหาสมาชิกก่อน</div>';return}const p=paymentData();if(!p.amount||!p.transferDate||!p.transferTime||!p.referenceNo){paymentResult.innerHTML='<div class="warn">ข้อมูลรายการยังไม่ครบ</div>';return}if(!p.bankVerified){paymentResult.innerHTML='<div class="warn">ต้องตรวจด้วยแอปธนาคารและยืนยันเงินเข้าก่อน</div>';return}paymentResult.innerHTML='<div class="info">กำลังบันทึกลงฐานกลาง...</div>';try{const d=await api('savePayment',{citizenId:selectedMember.citizenId,firstName:selectedMember.firstName,lastName:selectedMember.lastName,...p,receipt:''});paymentResult.innerHTML=d.ok?'<div class="saveOk">✓ บันทึกลง Google Sheet แล้ว</div>':'<div class="warn">'+(d.message||'บันทึกไม่สำเร็จ')+'</div>';if(d.ok)renderReport()}catch(e){paymentResult.innerHTML='<div class="warn">บันทึกไม่สำเร็จ กรุณาลองใหม่</div>'}}
async function renderReport(){try{const d=await api('getReport',{from:reportFrom.value,to:reportTo.value});if(!d.ok)return;lastReport=d.items||d.payments||[];const s=d.summary||{};reportSummary.innerHTML='<div><small>จำนวนรายการ</small><b>'+(s.paymentCount??lastReport.length).toLocaleString('th-TH')+'</b></div><div><small>สมาชิก</small><b>'+(s.memberCount??0).toLocaleString('th-TH')+'</b></div><div><small>ยอดรวม</small><b>'+Number(s.totalAmount||0).toLocaleString('th-TH')+' ฿</b></div><div><small>ผลตอบแทนรวม</small><b>'+Number(s.totalPromoReturn||s.totalReturn||0).toLocaleString('th-TH')+' ฿</b></div>';reportRows.innerHTML=lastReport.length?lastReport.map(x=>'<tr><td>'+(x.transferDate||x.date||'')+' '+(x.transferTime||x.time||'')+'</td><td>'+(x.firstName?x.firstName+' '+x.lastName:(x.member||''))+'</td><td>'+Number(x.amount||0).toLocaleString('th-TH')+'</td><td>'+(x.rulePeriod||x.period||'')+'</td><td>'+Number(x.promoReturn||x.reward||0).toLocaleString('th-TH')+'</td><td>✓</td><td>'+(x.reviewStatus||x.memberStatus||'รอตรวจทาน')+'</td></tr>').join(''):'<tr><td colspan="7">ยังไม่มีรายการ</td></tr>'}catch(e){}}
function exportCSV(){if(!lastReport.length){alert('ไม่มีข้อมูลสำหรับ Export');return}const rows=[['วันที่','เวลา','สมาชิก','ยอด','เลขอ้างอิง','ช่วง','ผลตอบแทน','สถานะสมาชิก'],...lastReport.map(x=>[x.transferDate||x.date||'',x.transferTime||x.time||'',(x.firstName||'')+' '+(x.lastName||''),x.amount||0,x.referenceNo||x.reference||'',x.rulePeriod||x.period||'',x.promoReturn||x.reward||'',x.reviewStatus||x.memberStatus||'รอตรวจทาน'])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='T2Project-Report.csv';a.click();URL.revokeObjectURL(a.href)}
async function staffLogout(){try{await api('staffLogout')}catch(e){}sessionStorage.removeItem('t2_staff');location.href='admin-login.html'}
document.addEventListener('DOMContentLoaded',guard);