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
let selectedMember=null;
function cleanName(v){return String(v||'').trim().replace(/^(นาย|นางสาว|นาง|น\.ส\.|น\.ส)\s*/,'').replace(/\s+/g,' ')}
async function findMember(){
 const id=aCitizen.value.replace(/\D/g,''),name=cleanName(aName.value),out=findResult;
 if(id.length!==13||!name){out.innerHTML='<div class="warn">กรอกเลขบัตร 13 หลัก และชื่อ-นามสกุล</div>';return}
 out.innerHTML='<div class="info">กำลังค้นหา Master...</div>';
 try{const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'login',citizenId:id,fullName:name})});const data=await res.json();
 if(data.ok&&data.member){selectedMember={citizenId:id,firstName:data.member.firstName,lastName:data.member.lastName};out.innerHTML='<div class="saveOk">✓ พบสมาชิก: <b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b></div>';selectedMemberBox();}
 else{selectedMember=null;out.innerHTML='<div class="warn">ไม่พบข้อมูลสมาชิกที่ตรงกัน</div>';selectedMemberBox();}}
 catch(e){out.innerHTML='<div class="warn">เชื่อมต่อฐานสมาชิกไม่ได้ กรุณาลองใหม่</div>'}
}
function selectedMemberBox(){document.getElementById('selectedMember').innerHTML=selectedMember?'สมาชิกที่เลือก: <b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b>':'กรุณาค้นหาและเลือกสมาชิกก่อนลงรายการ'}
function previewPayment(){
 const a=Number(amount.value),d=payDate.value,t=payTime.value,r=reference.value.trim(),o=paymentResult;
 if(!selectedMember){o.innerHTML='<div class="warn">กรุณาค้นหาสมาชิกก่อน</div>';return}
 if(!a||!d||!t||!r){o.innerHTML='<div class="warn">กรุณากรอกยอด วันที่ เวลา และเลขอ้างอิง</div>';return}
 const c=calculateMoney(d,a);let result='';
 if(c.status==='matched')result=c.matches.map(x=>'<b>ช่วง '+x.period+'</b> • จ่าย '+x.paid.toLocaleString('th-TH')+' บาท → จำนวนเงินตามตาราง '+x.receive.toLocaleString('th-TH')+' บาท').join('<br>');
 else if(c.status==='none')result='<b>ไม่พบช่วงเงินใน PDF สำหรับวันที่นี้</b>';
 else result='<b>พบช่วง '+c.periods.join(', ')+'</b> แต่ยอดนี้ไม่มีคู่ตัวเงินที่ถอดได้ชัดเจน — ต้องตรวจสอบ';
 o.innerHTML='<div class="'+(bankVerified.checked?'info':'warn')+'"><b>'+selectedMember.firstName+' '+selectedMember.lastName+'</b><br>'+a.toLocaleString('th-TH')+' บาท • '+d+' '+t+' • Ref '+r+'<br>'+result+'<br><b>ธนาคาร:</b> '+(bankVerified.checked?'✓ Admin ยืนยันเงินเข้าแล้ว':'รอตรวจด้วยแอปธนาคาร')+'</div>';
}
function loadPayments(){try{return JSON.parse(localStorage.getItem('t2_admin_payments')||'[]')}catch(e){return[]}}
function savePayments(v){localStorage.setItem('t2_admin_payments',JSON.stringify(v))}
function savePayment(){
 if(!selectedMember){paymentResult.innerHTML='<div class="warn">กรุณาค้นหาสมาชิกก่อน</div>';return}
 const a=Number(amount.value),d=payDate.value,t=payTime.value,r=reference.value.trim();
 if(!a||!d||!t||!r){paymentResult.innerHTML='<div class="warn">ข้อมูลรายการยังไม่ครบ</div>';return}
 if(!bankVerified.checked){paymentResult.innerHTML='<div class="warn">ต้องตรวจสลิปด้วยแอปธนาคารและยืนยันเงินเข้าก่อนบันทึก</div>';return}
 const list=loadPayments();if(list.some(x=>x.reference===r)){paymentResult.innerHTML='<div class="warn">เลขอ้างอิงนี้ถูกบันทึกแล้ว — ไม่อนุญาตรายการซ้ำ</div>';return}
 const c=calculateMoney(d,a),match=c.status==='matched'?c.matches[0]:null;
 list.push({id:'PAY-'+Date.now(),citizenId:selectedMember.citizenId,member:selectedMember.firstName+' '+selectedMember.lastName,amount:a,date:d,time:t,reference:r,note:note.value.trim(),bankVerified:true,period:match?match.period:'ตรวจสอบ',reward:match?match.receive:null,memberStatus:'รอตรวจทาน',createdAt:new Date().toISOString()});
 savePayments(list);paymentResult.innerHTML='<div class="saveOk">✓ บันทึกรายการแล้ว และนำเข้า Report แล้ว</div>';renderReport();
}
function filteredPayments(){let list=loadPayments(),f=reportFrom.value,to=reportTo.value,s=reportStatus.value;return list.filter(x=>(!f||x.date>=f)&&(!to||x.date<=to)&&(!s||(s==='verified'?x.bankVerified:!x.bankVerified)))}
function renderReport(){
 const list=filteredPayments(),total=list.reduce((s,x)=>s+x.amount,0),reward=list.reduce((s,x)=>s+(Number(x.reward)||0),0),members=new Set(list.map(x=>x.citizenId)).size;
 reportSummary.innerHTML='<div><small>จำนวนรายการ</small><b>'+list.length.toLocaleString('th-TH')+'</b></div><div><small>สมาชิก</small><b>'+members.toLocaleString('th-TH')+'</b></div><div><small>ยอดรวม</small><b>'+total.toLocaleString('th-TH')+' ฿</b></div><div><small>ผลตอบแทนรวม</small><b>'+reward.toLocaleString('th-TH')+' ฿</b></div>';
 reportRows.innerHTML=list.length?list.map(x=>'<tr><td>'+x.date+' '+x.time+'</td><td>'+x.member+'</td><td>'+x.amount.toLocaleString('th-TH')+'</td><td>'+x.period+'</td><td>'+(x.reward==null?'รอตรวจ':Number(x.reward).toLocaleString('th-TH'))+'</td><td>'+(x.bankVerified?'✓':'รอตรวจ')+'</td><td>'+x.memberStatus+'</td></tr>').join(''):'<tr><td colspan="7">ยังไม่มีรายการ</td></tr>';
}
function exportCSV(){const list=filteredPayments();if(!list.length){alert('ไม่มีข้อมูลสำหรับ Export');return}const rows=[['วันที่','เวลา','สมาชิก','เลขบัตร','ยอด','เลขอ้างอิง','ช่วง','ผลตอบแทน','ตรวจธนาคาร','สถานะสมาชิก'],...list.map(x=>[x.date,x.time,x.member,x.citizenId,x.amount,x.reference,x.period,x.reward??'',x.bankVerified?'ยืนยันแล้ว':'รอตรวจ',x.memberStatus])];const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='T2Project-Report-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href)}
document.addEventListener('DOMContentLoaded',renderReport);
