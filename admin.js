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

function findMember(){const id=document.getElementById('aCitizen').value.replace(/\D/g,'');const n=document.getElementById('aName').value.trim();document.getElementById('findResult').innerHTML=(id.length===13&&n)?'<div class="info">พร้อมค้นหาฐานสมาชิกจาก Excel ที่นำเข้า</div>':'<div class="warn">กรอกเลขบัตรและชื่อ-นามสกุล</div>';}
function previewPayment(){const a=Number(document.getElementById('amount').value),d=document.getElementById('payDate').value,t=document.getElementById('payTime').value,r=document.getElementById('reference').value.trim(),o=document.getElementById('paymentResult');if(!a||!d||!t){o.innerHTML='<div class="warn">กรุณากรอกยอด วันที่ และเวลาโอน</div>';return;}const c=calculateMoney(d,a);let result='';if(c.status==='matched')result=c.matches.map(x=>'<b>ช่วง '+x.period+'</b> • จ่าย '+x.paid.toLocaleString('th-TH')+' บาท → จำนวนเงินตามตาราง '+x.receive.toLocaleString('th-TH')+' บาท').join('<br>');else if(c.status==='none')result='<b>ไม่พบช่วงเงินใน PDF สำหรับวันที่นี้</b>';else result='<b>พบช่วง '+c.periods.join(', ')+'</b> แต่ยอดนี้ไม่มีคู่ตัวเงินที่ถอดได้ชัดเจนจาก PDF — ให้ตรวจสอบก่อนบันทึก';o.innerHTML='<div class="'+(c.status==='matched'?'info':'warn')+'"><b>รายการ:</b> '+a.toLocaleString('th-TH')+' บาท • '+d+' '+t+(r?' • '+r:'')+'<br>'+result+'<br><small>ระบบไม่นำรถ ทอง พระ QFS A17 กล่อง iPad ซิม SPC หรือของแถมอื่นมาคำนวณ</small></div>';}
