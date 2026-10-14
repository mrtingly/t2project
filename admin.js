const MONEY_RULES=[
{n:1,from:"2025-03-11",to:"2025-03-11",tiers:[[100,50000]]},{n:2,from:"2025-03-13",to:"2025-04-17",tiers:[[100,150000]]},{n:3,from:"2025-04-18",to:"2025-04-27",tiers:[[100,100000]]},{n:4,from:"2025-04-28",to:"2025-05-27",tiers:[[100,30000]]},{n:5,from:"2025-05-28",to:"2025-06-21",tiers:[[100,200000]]},{n:6,from:"2025-06-22",to:"2025-07-06",tiers:[[100,250000]]},{n:7,from:"2025-07-07",to:"2025-07-30",tiers:[[100,500000]]},{n:8,from:"2025-07-31",to:"2025-08-11",tiers:[[100,600000]]},{n:9,from:"2025-08-12",to:"2025-08-13",tiers:[[100,800000]]},{n:10,from:"2025-08-14",to:"2025-08-21",tiers:[[100,100000]]},{n:11,from:"2025-08-22",to:"2025-09-18",tiers:[[100,2000000]]},{n:12,from:"2025-09-19",to:"2025-09-25",tiers:[[100,3000000]]},{n:13,from:"2025-09-26",to:"2025-10-08",tiers:[[100,4000000]]},{n:14,from:"2025-10-17",to:"2025-10-25",tiers:[[100,5000000]]},{n:15,from:"2025-10-27",to:"2025-11-10",tiers:[[100,5000000],[400,20000000]]},{n:16,from:"2025-10-27",to:"2025-11-10",tiers:[[500,25000000],[900,45000000]]},{n:17,from:"2025-10-27",to:"2025-11-10",tiers:[[1000,50000000]]},{n:18,from:"2025-10-27",to:"2025-11-10",tiers:[[10000,500000000]]},{n:19,from:"2025-11-15",to:"2025-11-30",tiers:[[500,25000000],[10000,500000000]]},{n:20,from:"2025-12-01",to:"2025-12-12",tiers:[[500,25000000],[10000,500000000]]},{n:21,from:"2025-12-30",to:"2026-01-11",tiers:[[1000,50000000],[2000,100000000]]},{n:22,from:"2026-01-12",to:"2026-01-19",tiers:[[1000,50000000],[2000,100000000]]},{n:23,from:"2026-02-16",to:"2026-03-10",tiers:[[100,1000000]]},{n:24,from:"2026-03-11",to:"2026-03-16",tiers:[[500,20000000]]},{n:25,from:"2026-03-17",to:"2026-03-19",tiers:[[100,4000000],[400,16000000],[500,40000000]]},{n:26,from:"2026-03-19",to:"2026-03-31",tiers:[[100,1000000],[400,4000000],[500,20000000]]},{n:27,from:"2026-03-31",to:"2026-04-05",tiers:[[100,1000000],[400,4000000],[500,20000000],[1000,40000000],[2000,80000000]]},{n:28,from:"2026-04-06",to:"2026-04-21",tiers:[[100,1000000],[500,5000000],[1000,20000000],[2000,40000000]]},{n:29,from:"2026-04-22",to:"2026-04-25",tiers:[[100,2000000],[10000,500000000]]},{n:30,from:"2026-04-30",to:"2026-05-05",tiers:[[100,2000000],[5000,250000000],[10000,600000000]]},{n:31,from:"2026-05-06",to:"2026-05-13",tiers:[[100,100000],[500,500000],[10000,10000000]]},{n:32,from:"2026-05-14",to:"2026-05-15",tiers:[[100,1000000],[10000,100000000]]},{n:33,from:"2026-05-16",to:"2026-06-05",tiers:[[100,1000000],[500,5000000],[1000,10000000],[10000,100000000]]},{n:34,from:"2026-06-09",to:"2026-06-12",tiers:[[300,30000],[10000,10000000]]},{n:35,from:"2026-06-22",to:"2026-06-27",tiers:[[100,50000],[200,100000],[300,150000]]},{n:36,from:"2026-07-03",to:"2026-07-10",tiers:[[100,1000000],[200,2000000],[300,3000000],[10000,10000000]]},{n:37,from:"2026-07-22",to:"2026-08-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},{n:38,from:"2026-08-18",to:"2026-08-20",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000]]},{n:39,from:"2026-09-01",to:"2026-09-04",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,202000000]]},{n:40,from:"2026-09-18",to:"2026-09-23",tiers:[[100,2000000],[200,4000000],[300,6000000],[400,8000000],[500,10000000],[600,12000000],[1000,200000000],[10000,502000000]]}
];
const API_URL="https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec";
let staff=null,members=[],selected=null,editingPaymentId=null,reportItems=[];
let masterCheckedNoMatch=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>"฿"+Number(n||0).toLocaleString("th-TH");
async function api(action,data={}){const r=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,token:staff?.token,...data})});return r.json()}
async function guard(){staff=JSON.parse(sessionStorage.getItem("t2_staff")||"null");if(!staff?.token){location.href="admin-login.html";return false}try{const d=await api("checkSession");if(!d.ok){sessionStorage.removeItem("t2_staff");location.href="admin-login.html";return false}$("staffName").textContent=(staff.displayName||staff.username||"Admin")+" · "+(staff.adminId||"");return true}catch(e){$("staffName").textContent="เชื่อมต่อระบบไม่ได้";return false}}
async function logout(){try{await api("staffLogout")}catch(e){}sessionStorage.removeItem("t2_staff");location.href="admin-login.html"}
function filterMyMembers(){
 const box=$("memberList"),input=$("memberSearch");
 if(!box||!input)return;
 const query=String(input.value||"").trim().toLocaleLowerCase("th-TH").replace(/\s+/g,"");
 const extra=$("masterSearchActions"),create=$("createMemberBox");
 masterCheckedNoMatch=false;
 if(extra)extra.classList.add("hidden");
 if(create)create.classList.add("hidden");
 if($("memberMessage"))$("memberMessage").textContent="";
 if(!query){box.innerHTML='<div class="muted tiny" style="margin-top:12px">เริ่มพิมพ์ชื่อหรือนามสกุลเพื่อค้นหา</div>';return;}
 const hits=members.map((m,i)=>({m,i})).filter(({m})=>[m.firstName,m.lastName,(m.firstName||"")+" "+(m.lastName||""),m.memberId].some(x=>String(x||"").toLocaleLowerCase("th-TH").replace(/\s+/g,"").includes(query))).slice(0,30);
 box.innerHTML=hits.length?hits.map(({m,i})=>`<div class="member ${selected?.memberId===m.memberId?"active":""}"><div style="min-width:0;overflow-wrap:anywhere"><b>${esc((m.firstName||"")+" "+(m.lastName||""))}</b><div class="muted tiny">${esc(m.memberId||"")}</div></div><div class="actions"><button class="btn alt" onclick="selectMember(${i})">เลือก</button>${String(m.status||"").toLowerCase()==="pending"?`<button class="btn" onclick="approveMember(${i})">ยืนยันและอนุมัติ</button>`:String(m.status||"").toLowerCase()==="active"?`<button class="btn alt" onclick="issueActivation(${i})">ออกรหัสเปิดใช้งาน</button>`:""}</div></div>`).join(""):'<div class="muted tiny" style="margin-top:12px">ไม่พบสมาชิกในความรับผิดชอบ ลองค้นหาใน Master</div>';
 if(!hits.length&&extra)extra.classList.remove("hidden");
}
async function loadMembers(){
 const box=$("memberList");
 try{const d=await api("getMyMembers");members=d.items||d.members||[];filterMyMembers();}
 catch(e){box.innerHTML='<div class="warn">โหลดข้อมูลสมาชิกไม่สำเร็จ</div>';}
}
async function approveMember(i){const m=members[i];if(!m||String(m.status||"").toLowerCase()!=="pending")return;const fullName=((m.firstName||"")+" "+(m.lastName||"")).trim();if(!confirm("คุณได้ตรวจสอบตัวตนของสมาชิก "+fullName+" กับเจ้าตัวแล้ว และยืนยันเปิดสิทธิ์ให้สร้างโปรไฟล์ใช่หรือไม่?"))return;const box=$("memberMessage");box.textContent="กำลังอนุมัติสมาชิก…";try{const d=await api("approveMember",{memberId:m.memberId,identityConfirmed:true});box.innerHTML=d.ok?'<div class="ok">อนุมัติสมาชิกเรียบร้อยแล้ว<br><strong>รหัสเปิดใช้งานครั้งแรก (ใช้ครั้งเดียว ภายใน 24 ชั่วโมง)</strong><br><code style="font-size:18px;overflow-wrap:anywhere">'+esc(d.activationCode||'ไม่พบรหัส')+'</code><br>กรุณาส่งรหัสให้สมาชิกผ่านช่องทางที่ตรวจสอบตัวตนแล้ว รหัสนี้จะไม่แสดงซ้ำ</div>':'<div class="warn">'+esc(d.message||"อนุมัติไม่สำเร็จ")+'</div>';if(d.ok)await loadMembers()}catch(e){box.innerHTML='<div class="warn">เชื่อมต่อระบบอนุมัติไม่ได้</div>'}}
async function issueActivation(i){const m=members[i];if(!m)return;if(!confirm('คุณตรวจสอบตัวตนสมาชิกกับเจ้าตัวแล้ว และต้องการออกรหัสเปิดใช้งานให้สมาชิกคนนี้ใช่หรือไม่?'))return;const box=$('memberMessage');try{const d=await api('issueMemberActivation',{memberId:m.memberId});box.innerHTML=d.ok?'<div class="ok"><b>รหัสเปิดใช้งานครั้งเดียว (หมดอายุ 24 ชั่วโมง)</b><br><code style="font-size:18px;overflow-wrap:anywhere">'+esc(d.activationCode)+'</code><br>แจ้งรหัสให้สมาชิกผ่านช่องทางที่ยืนยันตัวตนแล้ว</div>':'<div class="warn">'+esc(d.message||'ไม่สามารถออกรหัสได้')+'</div>'}catch(e){box.textContent='เชื่อมต่อระบบไม่ได้'}}
function selectMember(i){const m=members[i];if(!m)return;selected={memberId:m.memberId||"",citizenId:m.documentId||m.citizenId||"",firstName:m.firstName||"",lastName:m.lastName||""};$("selectedMember").innerHTML="<b>สมาชิกที่เลือก:</b> "+esc(selected.firstName+" "+selected.lastName)+'<div class="muted tiny">'+esc(selected.memberId)+"</div>";$("memberSearch").value="";$("memberList").innerHTML="";$("masterSearchActions")?.classList.add("hidden");$("createMemberBox")?.classList.add("hidden");$("memberMessage").textContent="";newReceipt(false)}
async function findMember(){
 const query=String($("memberSearch")?.value||"").trim();
 const box=$("memberMessage");if(!query)return;
 const words=query.split(/\s+/).filter(Boolean);
 box.textContent="กำลังค้นหาใน Master…";
 try{
  const d=await api("findMemberV2",{firstName:words[0]||"",lastName:words.slice(1).join(" ")});
  if(!d.ok){box.innerHTML='<div class="warn">'+esc(d.message||"ค้นหาไม่สำเร็จ")+'</div>';return;}
  const list=d.items||d.members||(d.member?[d.member]:[]);
  masterCheckedNoMatch=list.length===0;
  if(list.length){
   box.innerHTML=list.slice(0,20).map(m=>'<div class="ok" style="margin-bottom:8px"><b>'+esc(((m.firstName||"")+" "+(m.lastName||"")).trim())+'</b><div class="muted tiny">'+esc(m.memberId||"")+'</div><div class="tiny">พบใน Master — ตรวจสอบสิทธิ์และเพิ่มเป็นสมาชิกในความรับผิดชอบก่อนทำรายการ</div></div>').join("");
  }else{
   box.innerHTML='<div class="warn">ไม่พบใน Master สามารถกรอกข้อมูลเพื่อเพิ่มสมาชิกใหม่ได้</div>';
  }
  const form=$("createMemberBox");form?.classList.remove("hidden");
  $("firstName").value=words[0]||"";$("lastName").value=words.slice(1).join(" ");
 }catch(e){box.innerHTML='<div class="warn">เชื่อมต่อ Master ไม่สำเร็จ กรุณาลองใหม่</div>';}
}
async function createMember(){
 const first=$("firstName").value.trim(),last=$("lastName").value.trim(),citizen=$("citizenId").value.replace(/[\s-]/g,"").trim();
 const box=$("memberMessage");
 if(!masterCheckedNoMatch){box.innerHTML='<div class="warn">กรุณาค้นหาใน Master ก่อนเพิ่มสมาชิกใหม่</div>';return;}
 if(!first||!last||!/^[0-9]{13}$/.test(citizen)){box.innerHTML='<div class="warn">กรุณากรอกชื่อ นามสกุล และเลขบัตรประชาชน 13 หลักให้ครบ</div>';return;}
 const exact=members.find(m=>String(m.firstName||"").trim()===first&&String(m.lastName||"").trim()===last || String(m.citizenId||m.documentId||"").replace(/[\s-]/g,"")===citizen);
 if(exact){box.innerHTML='<div class="warn">พบสมาชิกนี้อยู่แล้ว กรุณาเลือกจากผลค้นหาแทนการสร้างใหม่</div>';return;}
 const btn=$("createMemberBox")?.querySelector("button");
 if(btn)btn.disabled=true;
 try{
  // Recheck the authoritative master immediately before attempting a write.
  const check=await api("findMemberV2",{firstName:first,lastName:last,citizenId:citizen,documentId:citizen});
  if(!check.ok){box.innerHTML='<div class="warn">'+esc(check.message||"ตรวจ Master ไม่สำเร็จ")+'</div>';return;}
  const found=check.items||check.members||(check.member?[check.member]:[]);
  if(found.length){masterCheckedNoMatch=false;box.innerHTML='<div class="warn">มีข้อมูลตรงกันใน Master แล้ว ไม่สร้างรายการซ้ำ กรุณาตรวจสอบสมาชิกเดิม</div>';return;}
  if(!confirm("ยืนยันว่าตรวจสอบข้อมูลแล้วและต้องการสร้างสมาชิกใหม่?"))return;
  const d=await api("createMember",{firstName:first,lastName:last,citizenId:citizen});
  box.innerHTML=d.ok?'<div class="ok">เพิ่มสมาชิกแล้ว</div>':'<div class="warn">'+esc(d.message||"เพิ่มไม่ได้")+'</div>';
  if(d.ok){masterCheckedNoMatch=false;$("createMemberBox")?.classList.add("hidden");await loadMembers();}
 }catch(e){box.innerHTML='<div class="warn">ตรวจสอบหรือเพิ่มสมาชิกไม่สำเร็จ ไม่มีการยืนยันการสร้างรายการ</div>'}
 finally{if(btn)btn.disabled=false}
}
function normalizePromoDate(date){const p=String(date||"").split("-");if(p.length===3&&Number(p[0])>2400)p[0]=String(Number(p[0])-543);return p.join("-")}
function promo(date,amount){
 date=normalizePromoDate(date);
 const a=Number(amount||0),rs=MONEY_RULES.filter(r=>date>=r.from&&date<=r.to);
 if(!rs.length)return {status:"none"};
 const matches=[];
 rs.forEach(r=>{
   const exact=r.tiers.find(([paid])=>a===paid);
   if(exact){matches.push({period:r.n,receive:exact[1],mode:"exact"});return}
   const ratios=r.tiers.map(([paid,receive])=>receive/paid);
   const sameRatio=ratios.length>0&&ratios.every(x=>Math.abs(x-ratios[0])<0.000001);
   if(sameRatio&&a>0)matches.push({period:r.n,receive:Math.round(a*ratios[0]),mode:"ratio"});
 });
 return matches.length?{status:"matched",matches}:{status:"review",periods:rs.map(r=>r.n)};
}
function previewPromo(){const d=$("payDate").value,a=Number($("amount").value||0),box=$("promoBox");if(!d||!a){box.textContent="เลือกวันที่และจำนวนเงินเพื่อคำนวณโปร";return}const p=promo(d,a);if(p.status==="matched"){box.innerHTML='<b>ยอดลงทุน '+money(a)+'</b><br><b>ยอดที่จะได้รับตามโปร:</b> '+p.matches.map(x=>"ช่วง "+x.period+" → <strong>"+money(x.receive)+"</strong>").join(" / ")}else if(p.status==="review"){box.innerHTML='<b>วันที่อยู่ในโปร '+p.periods.join(", ")+'</b> แต่ยอดนี้ไม่มีคู่เงินที่ชัดเจนในต้นฉบับ ต้องตรวจเอกสาร'}else box.innerHTML="<b>ไม่พบโปรในวันที่นี้</b>"}
function previewSlip(e){const files=Array.from(e.target.files||[]);if(files.length>5){alert('เลือกสลิปได้ไม่เกิน 5 ใบต่อครั้ง');e.target.value='';return}t2BatchInit(files);const f=files[0];if(!f){$("slipPreviewBox").classList.add("hidden");$("slipPreview").removeAttribute("src");return}const r=new FileReader();r.onload=()=>{$("slipPreview").src=r.result;$("slipPreviewBox").classList.remove("hidden")};r.readAsDataURL(f);readSlipOCR(f)}
function receiptPayload(){const d=$("payDate").value,a=Number($("amount").value||0),p=promo(d,a);return {amount:a,transferDate:d,transferTime:$("payTime").value,referenceNo:$("reference").value.trim(),payerName:$("payerName").value.trim(),receiverName:$("receiverName").value.trim(),notes:$("note").value.trim(),bankVerified:$("bankVerified").checked,rulePeriod:p.status==="matched"?p.matches.map(x=>x.period).join(","):"",promoReturn:p.status==="matched"?Math.max(...p.matches.map(x=>x.receive)):0}}
function rowPaymentId(x){return String(x.paymentId||x.payment_id||x.id||"")}
function findMemberForRow(x){const cid=String(x.citizenId||x.citizen_id||x.documentId||x.document_id||"");return members.find(m=>String(m.citizenId||m.documentId||"")===cid)||null}
function editReceipt(i){
 const x=reportItems[i]; if(!x)return;
 const m=findMemberForRow(x); if(m){const mi=members.indexOf(m);if(mi>=0)selectMember(mi)}
 editingPaymentId=rowPaymentId(x); if(!editingPaymentId){alert("ไม่พบรหัสรายการ");return}
 $("payDate").value=normalizePromoDate(x.transferDate||x.transfer_date||"");
 $("payTime").value=x.transferTime||x.transfer_time||"";
 $("amount").value=Number(x.amount||0)||"";
 $("reference").value=String(x.referenceNo||x.reference_no||"").slice(-6);
 $("payerName").value=x.payerName||x.payer_name||"";
 $("receiverName").value=x.receiverName||x.receiver_name||"";
 $("note").value=x.notes||x.note||"";
 $("bankVerified").checked=true;
 $("receiptFormTitle").textContent="แก้ไขใบเสร็จ";
 $("saveReceiptBtn").textContent="บันทึกการแก้ไข";
 $("cancelEditBtn").classList.remove("hidden");
 $("newReceiptBtn").classList.add("hidden");
 previewPromo(); $("receiptFormTitle").scrollIntoView({behavior:"smooth",block:"start"});
}
function cancelEdit(){editingPaymentId=null;newReceipt(false)}
async function deleteReceipt(i){
 const x=reportItems[i],id=rowPaymentId(x); if(!id){alert("ไม่พบรหัสรายการ");return}
 const who=((x.firstName||"")+" "+(x.lastName||"")).trim();
 if(!confirm("ยืนยันลบใบเสร็จของ "+(who||"สมาชิก")+" รหัส "+String(x.referenceNo||"").slice(-6)+" ?"))return;
 try{const d=await api("deletePayment",{paymentId:id});if(!d.ok){alert(d.message||"ลบไม่สำเร็จ");return}await loadReport();alert("ลบรายการแล้ว")}catch(e){alert("เชื่อมต่อระบบไม่ได้")}
}
async function saveReceipt(){if(t2SlipQueue.length>1&&!editingPaymentId){await t2SaveBatch();return}if(!selected){$("saveMessage").innerHTML='<div class="warn">เลือกสมาชิกก่อน</div>';return}const p=receiptPayload();if(!p.transferDate||!p.transferTime||!p.amount||!p.payerName||!p.receiverName){$("saveMessage").innerHTML='<div class="warn">กรอกวันที่ เวลา จำนวนเงิน ผู้โอน และผู้รับให้ครบ</div>';return}if(!/^\d{6}$/.test(p.referenceNo)){$("saveMessage").innerHTML='<div class="warn">รหัสสลิปต้องเป็นตัวเลข 6 หลักท้ายเท่านั้น</div>';return}if(!p.bankVerified){$("saveMessage").innerHTML='<div class="warn">กรุณาตรวจข้อมูลในฟอร์มกับภาพสลิปและติ๊กยืนยันก่อนบันทึก</div>';return}$("saveMessage").innerHTML="กำลังบันทึก…";try{let uploadedReceipt="";
 const file=t2SlipQueue.length?t2SlipQueue[t2SlipIndex].file:$("slipImage")?.files?.[0];
 if(!file&&!editingPaymentId)throw Error("กรุณาแนบภาพสลิปก่อนบันทึกรายการใหม่");
 if(file){
   const capabilities=await api("round5Capabilities");
   if(!capabilities.ok||!capabilities.receiptUpload)throw Error("ต้อง Deploy Backend รอบ 5 ก่อน จึงจะเก็บภาพสลิปใน Drive ได้");
   if(!["image/jpeg","image/png","image/webp"].includes(file.type)){throw Error("รองรับสลิป JPG PNG หรือ WebP เท่านั้น")}
   const data=await fileToCompressedBase64(file);
   const uploaded=await api("uploadReceipt",{memberId:selected.memberId,mimeType:"image/jpeg",base64:data});
   if(!uploaded.ok)throw Error(uploaded.message||"จัดเก็บภาพสลิปใน Drive ไม่สำเร็จ");
   uploadedReceipt=uploaded.receipt;
 }
 const action=editingPaymentId?"updatePayment":"savePayment";const d=await api(action,{paymentId:editingPaymentId||"",citizenId:selected.citizenId,documentId:selected.citizenId,firstName:selected.firstName,lastName:selected.lastName,fullName:selected.firstName+" "+selected.lastName,...p,receipt:uploadedReceipt});if(d.ok){$("saveMessage").innerHTML='<div class="ok">✓ บันทึกรายการเรียบร้อย</div>';editingPaymentId=null;$("receiptFormTitle").textContent="เพิ่มใบเสร็จ / เงินลงทุน";$("saveReceiptBtn").textContent="บันทึกใบเสร็จ";$("cancelEditBtn").classList.add("hidden");$("newReceiptBtn").classList.remove("hidden");await loadReport()}else $("saveMessage").innerHTML='<div class="warn">'+esc(d.message||"บันทึกไม่สำเร็จ")+"</div>"}catch(e){$("saveMessage").innerHTML='<div class="warn">'+esc(e.message||"เชื่อมต่อระบบบันทึกไม่ได้")+'</div>'}}
function newReceipt(scroll=true){editingPaymentId=null;if($("receiptFormTitle"))$("receiptFormTitle").textContent="เพิ่มใบเสร็จ / เงินลงทุน";if($("saveReceiptBtn"))$("saveReceiptBtn").textContent="บันทึกใบเสร็จ";if($("cancelEditBtn"))$("cancelEditBtn").classList.add("hidden");["payDate","payTime","amount","reference","payerName","receiverName","note"].forEach(id=>$(id).value="");if($("slipImage"))$("slipImage").value="";if($("slipPreview"))$("slipPreview").removeAttribute("src");if($("slipPreviewBox"))$("slipPreviewBox").classList.add("hidden");$("bankVerified").checked=false;$("promoBox").textContent="เลือกวันที่และจำนวนเงินเพื่อคำนวณโปร";$("saveMessage").innerHTML="";$("newReceiptBtn").classList.add("hidden");if(scroll)$("payDate").scrollIntoView({behavior:"smooth",block:"center"})}
function thDateTime(){
 const d=new Date();
 return d.toLocaleDateString("th-TH",{year:"numeric",month:"long",day:"numeric"})+" เวลา "+d.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})+" น.";
}
function printDoc(title,body,landscape=false){
 const w=window.open("","_blank");if(!w){alert("กรุณาอนุญาต Pop-up เพื่อพิมพ์");return}
 const css='@page{size:A4 '+(landscape?'landscape':'portrait')+';margin:12mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Sans Thai",sans-serif;color:#172033;margin:0;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1769e0;padding-bottom:12px;margin-bottom:16px}.brand{font-size:25px;font-weight:900;color:#1559b7}.sub{color:#667085;margin-top:3px}.docTitle{text-align:right;font-size:18px;font-weight:800}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.box{border:1px solid #d8e0eb;border-radius:8px;padding:9px}.box small{display:block;color:#667085;margin-bottom:4px}.box b{font-size:14px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.sum{background:#f4f7fb;border:1px solid #d8e0eb;border-radius:8px;padding:10px}.sum small{display:block;color:#667085}.sum strong{font-size:18px;color:#123f70}table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#eef4fb;color:#123f70}th,td{border:1px solid #d9e1eb;padding:6px;text-align:left;vertical-align:top}.num{text-align:right;white-space:nowrap}.foot{margin-top:18px;padding-top:10px;border-top:1px solid #cfd8e5;color:#667085;font-size:10px;display:flex;justify-content:space-between}.status{display:inline-block;padding:4px 8px;border-radius:99px;background:#ecfdf3;color:#067647;font-weight:700}.note{margin-top:12px;border:1px solid #d8e0eb;border-radius:8px;padding:10px;min-height:45px}@media print{button{display:none}}';
 w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+css+'</style></head><body>'+body+'<script>window.onload=()=>window.print()<\\/script></body></html>');w.document.close();
}
function printAdminReport(){
 const rows=reportItems, total=rows.reduce((s,x)=>s+Number(x.amount||0),0), reward=rows.reduce((s,x)=>s+Number(x.promoReturn||0),0);
 const uniqueMembers=new Set(rows.map(x=>String(x.citizenId||x.citizen_id||x.documentId||x.document_id||((x.firstName||"")+" "+(x.lastName||""))))).size;
 const body='<div class="head"><div><div class="brand">T2Project</div><div class="sub">ระบบฐานข้อมูลกลางสมาชิกและรายการลงทุน</div></div><div><div class="docTitle">รายงานรายการของ Admin</div><div class="sub">ออกเอกสาร '+esc(thDateTime())+'</div></div></div>'+
 '<div class="meta"><div class="box"><small>Admin</small><b>'+esc(staff?.displayName||staff?.username||"—")+'</b></div><div class="box"><small>Admin ID</small><b>'+esc(staff?.adminId||"—")+'</b></div><div class="box"><small>จำนวนสมาชิกในรายงาน</small><b>'+uniqueMembers.toLocaleString("th-TH")+' คน</b></div><div class="box"><small>สถานะรายงาน</small><b>ข้อมูลตรวจเบื้องต้น</b></div></div>'+
 '<div class="summary"><div class="sum"><small>จำนวนรายการ</small><strong>'+rows.length.toLocaleString("th-TH")+'</strong></div><div class="sum"><small>ยอดลงทุนรวม</small><strong>'+money(total)+'</strong></div><div class="sum"><small>ผลตอบแทนตามโปรรวม</small><strong>'+money(reward)+'</strong></div></div>'+
 '<table><thead><tr><th>#</th><th>สมาชิก</th><th>วันที่</th><th>เวลา</th><th>ผู้โอน</th><th>ผู้รับ</th><th>Reference 6 หลัก</th><th class="num">จำนวนเงินลงทุน</th><th class="num">ผลตอบแทน</th><th>Admin ผู้จัดทำข้อมูล</th><th>หมายเหตุ</th></tr></thead><tbody>'+
 rows.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(((x.firstName||"")+" "+(x.lastName||"")).trim()||"—")+'</b><br><small>'+esc(x.memberId||x.member_id||"")+'</small></td><td>'+esc(x.transferDate||"—")+'</td><td>'+esc(x.transferTime||"—")+'</td><td>'+esc(x.payerName||"—")+'</td><td>'+esc(x.receiverName||"—")+'</td><td><b>'+esc(String(x.referenceNo||"").slice(-6)||"—")+'</b></td><td class="num">'+money(x.amount)+'</td><td class="num">'+money(x.promoReturn)+'</td><td>'+esc(x.notes||x.note||"")+'</td></tr>').join('')+
 '</tbody><tfoot><tr><th colspan="7">รวมทั้งรายงาน</th><th class="num">'+money(total)+'</th><th class="num">'+money(reward)+'</th><th></th></tr></tfoot></table>'+
 '<div class="foot"><span>เอกสารจาก T2Project · การตรวจสอบเบื้องต้นโดย Admin/Member</span><span>Owner ตรวจยืนยันภาพรวมกับ Statement ภายหลัง</span></div>';
 printDoc("T2Project Admin Report",body,true);
}
function printAdminReceipt(i){
 const x=reportItems[i];if(!x)return;
 const pid=rowPaymentId(x)||"—", member=((x.firstName||"")+" "+(x.lastName||"")).trim()||"—";
 const body='<div class="head"><div><div class="brand">T2Project</div><div class="sub">ระบบฐานข้อมูลกลางสมาชิกและรายการลงทุน</div></div><div><div class="docTitle">ใบรายการ / Payment Record</div><div class="sub">เลขที่รายการ '+esc(pid)+'</div></div></div>'+
 '<div class="meta"><div class="box"><small>สมาชิก</small><b>'+esc(member)+'</b></div><div class="box"><small>Member ID</small><b>'+esc(x.memberId||x.member_id||"—")+'</b></div><div class="box"><small>Admin ผู้จัดทำข้อมูล</small><b>'+esc(x.adminDisplayName||x.admin_display_name||x.adminUsername||x.admin_username||staff?.displayName||staff?.username||"—")+'</b></div><div class="box"><small>สถานะเบื้องต้น</small><span class="status">บันทึกในฐานข้อมูลแล้ว</span></div></div>'+
 '<table><tbody>'+
 [['วันที่โอน',x.transferDate||"—"],['เวลา',x.transferTime||"—"],['ชื่อผู้โอน',x.payerName||"—"],['ชื่อผู้รับ',x.receiverName||"—"],['Admin ผู้จัดทำข้อมูล',(x.adminDisplayName||x.admin_display_name||x.adminUsername||x.admin_username||staff?.displayName||staff?.username||"—")],['รหัสอ้างอิง 6 หลักท้าย',String(x.referenceNo||"").slice(-6)||"—"],['ยอดลงทุน',money(x.amount)],['ช่วงโปรโมชั่น',x.rulePeriod||x.rule_period||"—"],['ผลตอบแทนตามโปร',money(x.promoReturn)]].map(r=>'<tr><th style="width:38%">'+esc(r[0])+'</th><td><b>'+esc(r[1])+'</b></td></tr>').join('')+
 '</tbody></table><div class="note"><b>หมายเหตุ</b><br>'+esc(x.notes||x.note||"—")+'</div>'+
 '<div class="note"><b>สถานะการตรวจสอบ</b><br>รายการนี้ผ่านการบันทึกและตรวจสอบข้อมูลเบื้องต้นในกระบวนการ Admin/Member ของ T2Project การยืนยันยอดเงินจริงในภาพรวมดำเนินการโดย Owner จาก Statement ธนาคาร</div>'+
 '<div class="foot"><span>พิมพ์เมื่อ '+esc(thDateTime())+'</span><span>Reference: '+esc(String(x.referenceNo||"").slice(-6)||"—")+'</span></div>';
 printDoc("T2Project Payment "+pid,body,false);
}
async function loadReport(){try{const d=await api("getReport",{});const rows=d.items||d.payments||[];reportItems=rows;const s=d.summary||{};$("sumCount").textContent=Number(s.paymentCount??rows.length).toLocaleString("th-TH");$("sumAmount").textContent=money(s.totalAmount??rows.reduce((a,x)=>a+Number(x.amount||0),0));$("sumReturn").textContent=money(s.totalPromo??s.totalPromoReturn??s.totalReturn??rows.reduce((a,x)=>a+Number(x.promoReturn||0),0));$("reportRows").innerHTML=rows.length?rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.transferDate||"")}</td><td>${esc(x.transferTime||"")}</td><td>${esc((x.firstName||"")+" "+(x.lastName||""))}</td><td>${esc(x.payerName||"-")}</td><td>${esc(x.receiverName||"-")}</td><td>${esc(x.referenceNo||"")}</td><td>${money(x.amount)}</td><td>${money(x.promoReturn)}</td><td><div class="actions"><button class="btn alt" onclick="printAdminReceipt(${i})">พิมพ์</button><button class="btn alt" onclick="editReceipt(${i})">แก้ไข</button><button class="btn red" onclick="deleteReceipt(${i})">ลบ</button></div></td></tr>`).join(""):'<tr><td colspan="10">ยังไม่มีรายการ</td></tr>'}catch(e){$("reportRows").innerHTML='<tr><td colspan="10">โหลดรายงานไม่สำเร็จ</td></tr>'}}
document.addEventListener("DOMContentLoaded",async()=>{if(await guard()){await loadMembers();await loadReport()}});

function fileToCompressedBase64(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(Error("อ่านไฟล์ภาพไม่ได้"));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(Error("ไฟล์ภาพไม่ถูกต้อง"));
   img.onload=()=>{
    const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
    canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
    const b64=canvas.toDataURL("image/jpeg",0.72).split(",")[1]||"";
    if(b64.length>3500000){reject(Error("ภาพสลิปมีขนาดใหญ่เกินไป"));return}
    resolve(b64);
   };
   img.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}

/* Round 5 OCR: local browser recognition. Always verify values against the slip. */
let t2OcrScriptPromise=null,t2OcrJob=0;
function t2LoadOcr(){
 if(window.Tesseract&&typeof window.Tesseract.createWorker==='function')return Promise.resolve();
 if(t2OcrScriptPromise)return t2OcrScriptPromise;
 const sources=[
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js'
 ];
 t2OcrScriptPromise=(async()=>{
  for(const src of sources){
   try{
    await new Promise((resolve,reject)=>{
     const script=document.createElement('script');
     script.src=src;
     script.onload=()=>window.Tesseract?.createWorker?resolve():reject(Error('OCR module missing'));
     script.onerror=()=>reject(Error('OCR CDN unavailable'));
     document.head.appendChild(script);
    });
    return;
   }catch(e){console.warn('OCR script fallback',e)}
  }
  throw Error('โหลดเครื่องมือ OCR ไม่ได้ กรุณาตรวจอินเทอร์เน็ตและการบล็อก CDN');
 })().catch(e=>{t2OcrScriptPromise=null;throw e});
 return t2OcrScriptPromise;
}
function t2OcrExtract(raw){
 const digits='๐๑๒๓๔๕๖๗๘๙';
 const norm=s=>String(s||'').replace(/[๐-๙]/g,ch=>String(digits.indexOf(ch)));
 const lines=norm(raw).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const text=lines.join('\n');
 let date='',time='',amount='',reference='';
 const months={'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12};
 const dateNum=text.match(/(?:^|\D)(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?=\D|$)/m);
 const monthPattern=/(\d{1,2})\s*(ม\.?\s*ค\.?|ก\.?\s*พ\.?|มี\.?\s*ค\.?|เม\.?\s*ย\.?|พ\.?\s*ค\.?|มิ\.?\s*ย\.?|ก\.?\s*ค\.?|ส\.?\s*ค\.?|ก\.?\s*ย\.?|ต\.?\s*ค\.?|พ\.?\s*ย\.?|ธ\.?\s*ค\.?)\.?\s*(\d{2,4})/;
 const dateThai=text.match(monthPattern);
 let day,month,year;
 if(dateNum){day=+dateNum[1];month=+dateNum[2];year=+dateNum[3]}
 else if(dateThai){day=+dateThai[1];year=+dateThai[3];const token=dateThai[2].replace(/\s/g,'').replace(/\.$/,'')+'.';month=months[token]}
 if(year!==undefined){if(year<100)year=dateThai?2500+year:(year>=80?1900+year:2000+year);if(year>2400)year-=543;const dt=new Date(Date.UTC(year,month-1,day));if(dt.getUTCFullYear()===year&&dt.getUTCMonth()===month-1&&dt.getUTCDate()===day)date=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')}
 const contextDateLine=lines.find(x=>date&&/\d{1,2}\s*(?:มี\.?\s*ค|ก\.?\s*ค|ก\.?\s*พ|ม\.?\s*ค|เม\.?\s*ย|พ\.?\s*ค|มิ\.?\s*ย|ส\.?\s*ค|ก\.?\s*ย|ต\.?\s*ค|พ\.?\s*ย|ธ\.?\s*ค|\d{1,2}[\/.-]\d{1,2})/.test(x)&&/[0-2]?\d:[0-5]\d/.test(x))||'';
 const timeMatch=contextDateLine.match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?=\D|$)/);
 if(timeMatch)time=String(+timeMatch[1]).padStart(2,'0')+':'+timeMatch[2];
 for(let i=0;i<lines.length;i++){
  if(!/จำนวนเงิน|ยอดเงิน|จำนวนที่โอน|amount|total/i.test(lines[i])||/ค่าธรรมเนียม|fee/i.test(lines[i]))continue;
  const section=lines.slice(i,i+3).join(' ').replace(/(\d)[.](?=\d{3}[.,])/g,'$1,');
  // Bank slips often OCR thousands separators as periods or spaces.
  const m=section.match(/(?:จำนวนเงิน|ยอดเงิน|จำนวนที่โอน|amount|total)\s*[:：]?\s*(?:฿|THB)?\s*(\d[\d,. ]{0,20}\d|\d+)\s*(?:บาท|THB|$)/i)
      ||section.match(/(?:จำนวนเงิน|ยอดเงิน|จำนวนที่โอน|amount|total)[^\d]{0,16}(\d{1,3}(?:[,. ]\d{3})*[,.]\d{2}|\d+)/i);
  if(m){
   const token=m[1].replace(/\s+/g,'');
   const decimal=token.match(/^(.*)[,.](\d{2})$/);
   const val=decimal?Number(decimal[1].replace(/[,.]/g,'')+'.'+decimal[2]):Number(token.replace(/[,.]/g,''));
   if(Number.isFinite(val)&&val>0&&val<1e9){amount=String(val);break}
  }
 }
 if(!amount){
  const moneyLines=lines.filter(x=>/[\d,. ]+\s*(?:บาท|THB)/i.test(x)&&!/ค่าธรรมเนียม|fee/i.test(x));
  const found=moneyLines.map(x=>x.match(/(\d[\d,. ]{2,20})\s*(?:บาท|THB)/i)).filter(Boolean).map(x=>x[1].trim());
  if(found.length===1){
   const token=found[0].replace(/\s/g,''),decimal=token.match(/^(.*)[,.](\d{2})$/);
   const val=decimal?Number(decimal[1].replace(/[,.]/g,'')+'.'+decimal[2]):Number(token.replace(/[,.]/g,''));
   if(val>0&&val<1e9)amount=String(val);
  }
 }
 const marker=/เลขที่รายการ|เลขรายการ|เลขอ้างอิง|รหัสอ้างอิง|reference|ref(?:erence)?/i;
 for(let i=0;i<lines.length;i++){if(!marker.test(lines[i]))continue;const same=lines[i].match(/(\d{10,})/g);const nearby=lines.slice(i+1,i+4).flatMap(x=>[...x.matchAll(/(?:^|\D)(\d{12,25})(?=\D|$)/g)].map(m=>m[1]));const candidates=[...(same||[]),...nearby];if(candidates.length===1){reference=candidates[0].slice(-6);break}}
 let payer='',receiver='';
 for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^(?:โอนจาก|จาก|ผู้โอน|ชื่อผู้โอน|from|sender|โอนเข้า|ไปยัง|ถึง|ผู้รับ|ชื่อผู้รับ|to|recipient)\s*[:：-]?\s*(.*)$/i);
  if(!m)continue;
  const isPayer=/^(?:โอนจาก|จาก|ผู้โอน|ชื่อผู้โอน|from|sender)/i.test(lines[i]);
  let val=m[1].trim();
  if(!val||/^(?:บัญชี|account|ธนาคาร|bank)/i.test(val))continue;
  val=val.replace(/\s*(?:xxx[-x\d]+|เลขที่บัญชี).*$/i,'').trim();
  if(val.length<5)continue;
  if(isPayer&&!payer)payer=val;
  if(!isPayer&&!receiver)receiver=val;
 }
 return {date,time,amount,reference,payer,receiver,raw:String(raw||'')};
}
function t2OcrNames(raw){
 const lines=String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const result={payer:'',receiver:''};
 const labels={payer:/^(?:โอนจาก|จาก|ผู้โอน|ชื่อผู้โอน|sender|from)/i,receiver:/^(?:โอนเข้า|โอนเข้าบัญชี|ไปยัง|ถึง|ผู้รับ|ชื่อผู้รับ|recipient|to)/i};
 const clean=v=>String(v||'').replace(/(?:xxx|XXX)[\dxX-]*/g,'').replace(/(?:\b\d{2,}[-xX\d]*\b)/g,'').replace(/^[\s:：\-–]+|[\s:：\-–]+$/g,'').trim();
 const valid=v=>v.length>=5&&/[\u0e01-\u0e5aA-Za-z]/.test(v)&&!/(?:จำนวนเงิน|ค่าธรรมเนียม|เลขที่|บัญชี|ธนาคาร|รายการสำเร็จ|K PLUS|SME|วันทำรายการ)/i.test(v)&&!/\d{4,}/.test(v);
 const markerLine=lines.findIndex(line=>labels.payer.test(line)&&labels.receiver.test(line));
 if(markerLine>=0){
  // OCR frequently puts two column headings or two names on one line.
  const heading=lines[markerLine],fromMatch=heading.match(/(?:โอนจาก|จาก|ผู้โอน|sender|from)\s*(.*?)\s*(?:โอนเข้า|ไปยัง|ผู้รับ|recipient|to)\s*(.*)/i);
  if(fromMatch){if(valid(clean(fromMatch[1])))result.payer=clean(fromMatch[1]);if(valid(clean(fromMatch[2])))result.receiver=clean(fromMatch[2])}
  for(const line of lines.slice(markerLine+1,markerLine+7)){
   const halves=line.split(/\s{2,}|\t+/).map(clean).filter(valid);
   if(halves.length>=2){result.payer ||= halves[0];result.receiver ||= halves[1];break}
  }
 }
 for(const [kind,re] of Object.entries(labels)){
  if(result[kind])continue;
  const i=lines.findIndex(x=>re.test(x));if(i<0)continue;
  const inline=clean(lines[i].replace(re,''));
  if(valid(inline)&&!(labels.payer.test(inline)||labels.receiver.test(inline))){result[kind]=inline;continue}
  const candidates=lines.slice(i+1,i+6).map(clean).filter(valid);
  if(candidates.length)result[kind]=candidates[kind==='payer'?0:Math.min(1,candidates.length-1)]||'';
 }
 // Avoid copying the same ambiguous name into both sender and receiver.
 if(result.payer&&result.payer===result.receiver)result.receiver='';
 return result;
}
function t2OcrFillFields(result){
 const mapping={payDate:result.date,payTime:result.time,amount:result.amount,reference:result.reference,payerName:result.payer,receiverName:result.receiver};
 const filled=[];
 for(const [id,value] of Object.entries(mapping)){
  const input=$(id);
  if(input&&value){
   input.value=value;
   input.dataset.ocrFilled='true';
   input.dispatchEvent(new Event('input',{bubbles:true}));
   filled.push(id);
  }
 }
 return filled;
}
function retrySlipOCR(){const file=$("slipImage")?.files?.[0];if(file)readSlipOCR(file);else alert("กรุณาเลือกภาพสลิปก่อน")}
async function readSlipOCR(file){
 const box=$('ocrStatus');if(!box)return;
 const job=++t2OcrJob;
 box.textContent='กำลังเตรียมระบบอ่านสลิป (ไทย/อังกฤษ)...';
 try{
  await t2LoadOcr();
  box.textContent='กำลังอ่านข้อมูลจากรูปภาพ...';
  let worker;
  try{
   worker=await Tesseract.createWorker('tha+eng',1,{logger:m=>{
    if(job===t2OcrJob)box.textContent='OCR: '+String(m.status||'กำลังทำงาน')+(typeof m.progress==='number'?' '+Math.round(m.progress*100)+'%':'');
   }});
  }catch(thaiError){
   box.textContent='OCR ภาษาไทยโหลดไม่ได้ กำลังลองภาษาอังกฤษ...';
   worker=await Tesseract.createWorker('eng',1,{logger:m=>{
    if(job===t2OcrJob)box.textContent='OCR อังกฤษ: '+String(m.status||'กำลังทำงาน')+(typeof m.progress==='number'?' '+Math.round(m.progress*100)+'%':'');
   }});
  }
  let result;
  try{result=await worker.recognize(file)}finally{await worker.terminate()}
  if(job!==t2OcrJob)return;
  const data=t2OcrExtract(result.data?.text||'');
  const parsedNames=t2OcrNames(result.data?.text||'');
  data.payer=parsedNames.payer||data.payer;
  data.receiver=parsedNames.receiver||data.receiver;
  const mapping={payDate:data.date,payTime:data.time,amount:data.amount,reference:data.reference,payerName:data.payer,receiverName:data.receiver};
  const filled=t2OcrFillFields(data);
  previewPromo();
  box.textContent=filled.length?'OCR กรอกจริง '+filled.length+' ช่อง: '+filled.map(id=>({payDate:'วันที่',payTime:'เวลา',amount:'จำนวนเงิน',reference:'เลขอ้างอิง',payerName:'ผู้โอน',receiverName:'ผู้รับ'}[id])).join(', ')+' — โปรดตรวจทานก่อนบันทึก':'OCR ยังไม่กรอกช่องใด กรุณาตรวจข้อความที่อ่านได้';
  const detail=$('ocrRecognized');if(detail){detail.value=data.raw.slice(0,7000);detail.classList.remove('hidden')}
  if(t2SlipQueue.length){
   const current=t2SlipIndex;
   t2BatchCapture();
   t2SlipQueue[current].ocrDone=true;
   t2BatchRender();
   if(t2SlipQueue.length>1){
    const next=t2SlipQueue.findIndex((item,i)=>i>current&&!item.ocrDone);
    if(next>=0)setTimeout(()=>{if(!t2SlipBatchBusy&&t2SlipIndex===current)t2BatchSelect(next)},150);
   }
  }
 }catch(e){if(job===t2OcrJob)box.textContent='ระบบอ่านภาพอัตโนมัติไม่พร้อมใช้งาน กรุณากรอกตามภาพสลิป: '+String(e.message||e)}
}

/* Batch receipt entry: at most five selected files, each reviewed and saved independently. */
let t2SlipQueue=[],t2SlipIndex=0,t2SlipBatchBusy=false;
const T2_SLIP_FIELDS=['payDate','payTime','amount','reference','payerName','receiverName','note'];
function t2BatchCapture(){
 if(!t2SlipQueue.length)return;
 const item=t2SlipQueue[t2SlipIndex];
 item.values=Object.fromEntries(T2_SLIP_FIELDS.map(id=>[id,$(id).value]));
 item.verified=$('bankVerified').checked;
 t2BatchRender();
}
function t2BatchInit(files){
 t2SlipQueue.forEach(item=>{if(item.previewUrl)URL.revokeObjectURL(item.previewUrl)});
 t2SlipQueue=files.map(file=>({file,previewUrl:URL.createObjectURL(file),values:{},verified:false,done:false}));
 t2SlipIndex=0;
 if(files.length){T2_SLIP_FIELDS.forEach(id=>$(id).value='');$('bankVerified').checked=false}
 t2BatchRender();
}
function t2BatchRender(){
 const root=$('t2BatchQueue');if(!root)return;
 root.classList.toggle('hidden',t2SlipQueue.length<2);
 const formCard=root.closest('.card');if(formCard)formCard.classList.toggle('t2BatchMode',t2SlipQueue.length>1);
 if(t2SlipQueue.length<2){root.innerHTML='';return}
 const fields=[['payDate','วันที่','date'],['payTime','เวลา','time'],['amount','จำนวนเงิน','number'],['reference','รหัส 6 หลัก','text'],['payerName','ผู้โอน','text'],['receiverName','ผู้รับ','text']];
 root.innerHTML='<h3>ตรวจสลิป '+t2SlipQueue.length+' ใบ — ภาพและข้อมูลแยกแต่ละรายการ</h3>'+
 '<p class="muted tiny">ข้อมูล OCR จะเติมลงในแต่ละรายการ ตรวจชื่อ จำนวนเงิน เลขอ้างอิง และติ๊กยืนยันแยกแต่ละใบก่อนบันทึก</p>'+
 '<div class="t2BatchCards">'+t2SlipQueue.map((item,i)=>{
  const v=item.values||{},url=item.previewUrl||'',current=i===t2SlipIndex;
  const inputs=fields.map(([key,label,type])=>'<label class="t2BatchField">'+esc(label)+
   '<input type="'+type+'" data-batch-index="'+i+'" data-batch-field="'+key+'" value="'+esc(v[key]||'')+'" oninput="t2BatchEdit('+i+',this)" '+(item.done?'disabled':'')+'></label>').join('');
  return '<article class="t2BatchCard'+(current?' current':'')+'" id="t2SlipCard'+i+'"><header class="t2BatchCardHeader"><b>สลิปใบที่ '+(i+1)+'</b><span>'+esc(item.file.name.slice(0,35))+'</span><strong>'+(
   item.done?(item.duplicate?'รายการซ้ำ — ข้ามแล้ว':'บันทึกสำเร็จ'):item.verified?'ตรวจแล้ว':'รอตรวจ')+'</strong></header>'+
   '<div class="t2BatchCardBody"><div class="t2BatchPhoto"><img src="'+esc(url)+'" alt="ภาพสลิปใบที่ '+(i+1)+'"></div>'+
   '<div class="t2BatchFields">'+inputs+'<label class="t2BatchField wide">หมายเหตุ<textarea data-batch-index="'+i+'" data-batch-field="note" oninput="t2BatchEdit('+i+',this)" '+(item.done?'disabled':'')+'>'+esc(v.note||'')+'</textarea></label>'+
   '<label class="t2BatchConfirm"><input type="checkbox" '+(item.verified?'checked':'')+' onchange="t2BatchVerify('+i+',this.checked)" '+(item.done?'disabled':'')+'> ตรวจสอบกับภาพใบนี้แล้ว</label>'+
   '<button type="button" class="btn alt" onclick="t2BatchSelect('+i+')" '+(t2SlipBatchBusy?'disabled':'')+'>เลือกใบนี้ในฟอร์มหลัก / อ่าน OCR</button></div></div></article>';
 }).join('')+'</div><div class="actions" style="margin-top:14px"><button type="button" class="btn" onclick="t2SaveBatch()" '+(t2SlipBatchBusy?'disabled':'')+'>บันทึกใบที่ตรวจแล้วทั้งหมด ('+t2SlipQueue.length+' ใบ)</button></div>';
}
function t2BatchEdit(index,input){
 const item=t2SlipQueue[index];if(!item||item.done)return;
 const key=input.dataset.batchField;
 if(!item.values)item.values={};
 item.values[key]=input.value;
 if(index===t2SlipIndex){const target=$(key);if(target)target.value=input.value;if(key==='amount'||key==='payDate')previewPromo()}
}
function t2BatchVerify(index,checked){
 const item=t2SlipQueue[index];if(!item||item.done)return;
 item.verified=Boolean(checked);
 if(index===t2SlipIndex)$('bankVerified').checked=item.verified;
 t2BatchRender();
}
function t2BatchSelect(index){
 if(t2SlipBatchBusy||index<0||index>=t2SlipQueue.length)return;
 t2BatchCapture();
 t2SlipIndex=index;
 const item=t2SlipQueue[index];
 T2_SLIP_FIELDS.forEach(id=>$(id).value=item.values?.[id]||'');
 $('bankVerified').checked=!!item.verified;
 const reader=new FileReader();
 reader.onload=()=>{$('slipPreview').src=reader.result;$('slipPreviewBox').classList.remove('hidden')};
 reader.readAsDataURL(item.file);
 $('ocrRecognized').value='';
 $('ocrStatus').textContent=item.values?'ข้อมูลสลิปใบ '+(index+1)+' — ตรวจสอบอีกครั้งก่อนบันทึก':'กำลังอ่านสลิปใบ '+(index+1);
 t2BatchRender();previewPromo();
 if(!item.ocrDone)readSlipOCR(item.file);
}
async function t2SaveBatch(){
 if(t2SlipBatchBusy)return;
 if(!selected){$('saveMessage').textContent='กรุณาเลือกสมาชิกก่อน';return}
 t2BatchCapture();
 const items=t2SlipQueue;
 for(let i=0;i<items.length;i++){
  if(items[i].done)continue;
  const v=items[i].values||{},amount=Number(v.amount);
  if(!items[i].verified||!v.payDate||!v.payTime||!Number.isFinite(amount)||amount<=0||
   !/^\d{6}$/.test(v.reference||'')||!v.payerName?.trim()||!v.receiverName?.trim()){
   $('saveMessage').textContent='สลิปใบที่ '+(i+1)+' ยังตรวจไม่ครบ: วันที่ เวลา จำนวนเงิน เลขอ้างอิง ผู้โอน ผู้รับ หรือช่องยืนยัน';
   t2BatchSelect(i);return;
  }
 }
 t2SlipBatchBusy=true;t2BatchRender();
 const button=$('saveReceiptBtn');if(button)button.disabled=true;
 try{
  const capabilities=await api('round5Capabilities');
  if(!capabilities.ok||!capabilities.receiptUpload)throw Error('Backend ยังไม่พร้อมอัปโหลด');
  for(let i=0;i<items.length;i++){
   const item=items[i];if(item.done)continue;
   $('saveMessage').textContent='กำลังอัปโหลดและบันทึกใบ '+(i+1)+' จาก '+items.length;
   if(!item.uploadedReceipt){
    const encoded=await fileToCompressedBase64(item.file);
    const up=await api('uploadReceipt',{memberId:selected.memberId,mimeType:'image/jpeg',base64:encoded});
    if(!up.ok||!up.receipt)throw Error('อัปโหลดใบ '+(i+1)+' ไม่สำเร็จ: '+(up.message||''));
    item.uploadedReceipt=up.receipt;
   }
   const v=item.values,amount=Number(v.amount),r=promo(v.payDate,amount);
   const payload={citizenId:selected.citizenId,documentId:selected.citizenId,
    firstName:selected.firstName,lastName:selected.lastName,fullName:selected.firstName+' '+selected.lastName,
    transferDate:v.payDate,transferTime:v.payTime,amount,referenceNo:v.reference,
    payerName:v.payerName,receiverName:v.receiverName,notes:v.note||'',bankVerified:true,
    rulePeriod:r.status==='matched'?r.matches.map(x=>x.period).join(','):'',
    promoReturn:r.status==='matched'?Math.max(...r.matches.map(x=>x.receive)):0,
    receipt:item.uploadedReceipt};
   const saved=await api('savePayment',payload);
   if(!saved.ok){
    if(saved.duplicate){item.done=true;item.duplicate=true;continue}
    throw Error('บันทึกใบ '+(i+1)+' ไม่สำเร็จ: '+(saved.message||''));
   }
   item.done=true;item.paymentId=saved.paymentId;t2BatchRender();
  }
  $('saveMessage').innerHTML='<div class="ok">บันทึกครบ '+items.filter(x=>x.done&&!x.duplicate).length+' ใบ'+(items.some(x=>x.duplicate)?' (รายการซ้ำถูกข้าม)':'')+'</div>';
  await loadReport();
 }catch(e){$('saveMessage').innerHTML='<div class="warn">'+esc(e.message||String(e))+' — รายการที่สำเร็จแล้วจะไม่บันทึกซ้ำเมื่อกดอีกครั้ง</div>'}
 finally{t2SlipBatchBusy=false;if(button)button.disabled=false;t2BatchRender()}
}
