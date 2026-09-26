function toggleMenu(){document.getElementById('sideMenu').classList.toggle('open');document.getElementById('shade').classList.toggle('show')}
const API_URL='https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';
function normalizeName(v){return String(v||'').trim().replace(/^(นาย|นางสาว|นาง|น\.ส\.|น\.ส)\s*/,'').replace(/\s+/g,' ')}
async function memberSearch(){
 const id=document.getElementById('citizenId').value.replace(/\D/g,'');
 const name=normalizeName(document.getElementById('fullName').value);
 const out=document.getElementById('memberResult');
 const btn=document.querySelector('.primary');
 if(id.length!==13||!name.includes(' ')){out.innerHTML='<div class="warn">กรุณากรอกชื่อ นามสกุล และเลขบัตรประชาชน 13 หลัก</div>';return}
 btn.disabled=true;out.innerHTML='<div class="info">กำลังตรวจข้อมูลสมาชิก...</div>';
 try{
  const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'login',citizenId:id,fullName:name})});
  const data=await res.json();
  if(data&&data.ok&&data.member){
   sessionStorage.setItem('t2_member',JSON.stringify({citizenId:id,firstName:data.member.firstName,lastName:data.member.lastName,token:data.token}));
   location.href='member.html';return;
  }
  out.innerHTML='<div class="warn">ไม่พบข้อมูลสมาชิกที่ตรงกัน</div>';
 }catch(e){out.innerHTML='<div class="warn">ไม่สามารถเชื่อมต่อฐานสมาชิกได้ กรุณาลองใหม่</div>'}
 finally{btn.disabled=false}
}