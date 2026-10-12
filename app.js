const API_URL='https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';
function normalizeName(v){return String(v||'').trim().replace(/^(นาย|นางสาว|นาง|น\.ส\.|น\.ส)\s*/,'').replace(/\s+/g,' ')}
function switchMemberType(){const t=document.getElementById('memberType').value,i=document.getElementById('citizenId'),l=document.getElementById('documentLabel'),c=document.getElementById('countryWrap');if(t==='thai'){l.textContent='เลขบัตรประชาชน 13 หลัก';i.placeholder='เลขบัตรประชาชน';i.maxLength=13;i.inputMode='numeric';c.style.display='none'}else{l.textContent=t==='lao'?'Passport / รหัสสมาชิก (เช่น PA...)':'Passport';i.placeholder=t==='lao'?'Passport หรือ PA...':'Passport';i.maxLength=30;i.inputMode='text';c.style.display=t==='foreign'?'block':'none'}}

function switchLoginMode(){
 const mode=document.querySelector('input[name="loginMode"]:checked').value;
 document.getElementById('passwordLogin').style.display=mode==='password'?'block':'none';
 document.getElementById('activateLogin').style.display=mode==='activate'?'block':'none';
 document.getElementById('loginBtn').innerHTML=mode==='password'?'เข้าสู่ระบบ <span>›</span>':'ตั้งบัญชีสมาชิก <span>›</span>';
 document.getElementById('memberResult').textContent='';
}
async function memberSearch(){
 const mode=document.querySelector('input[name="loginMode"]:checked').value,out=document.getElementById('memberResult'),btn=document.getElementById('loginBtn');
 let body;
 if(mode==='password'){
  body={action:'memberPasswordLogin',username:document.getElementById('memberUsername').value.trim(),password:document.getElementById('memberPassword').value};
  if(!body.username||!body.password){out.textContent='กรุณากรอก User และ Password';return}
 }else{
  const type=document.getElementById('memberType').value,raw=document.getElementById('citizenId').value.trim(),doc=type==='thai'?raw.replace(/\D/g,''):raw.replace(/\s+/g,'').toUpperCase();
  const fullName=normalizeName(document.getElementById('fullName').value),pw=document.getElementById('newPassword').value;
  if(!doc||!fullName.includes(' ')||!pw||pw!==document.getElementById('confirmPassword').value){out.textContent='กรุณากรอกข้อมูลให้ครบ และตรวจสอบรหัสผ่านทั้งสองช่อง';return}
  body={action:'activateMemberAccount',citizenId:doc,documentId:doc,fullName,activationCode:document.getElementById('activationCode').value.trim(),username:document.getElementById('newUsername').value.trim(),password:pw};
 }
 btn.disabled=true;out.textContent='กำลังตรวจสอบข้อมูล...';
 try{
  const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}),data=await res.json();
  if(mode==='password'&&data.ok&&data.member&&data.token){
   sessionStorage.setItem('t2_member',JSON.stringify({citizenId:'',documentId:'',memberId:data.member.memberId,firstName:data.member.firstName,lastName:data.member.lastName,token:data.token}));
   location.href='member.html';return;
  }
  if(mode==='activate'&&data.ok){out.textContent='ตั้งบัญชีสำเร็จ กรุณาเลือกเข้าสู่ระบบด้วย User + Password';document.querySelector('input[value="password"]').checked=true;switchLoginMode();document.getElementById('memberResult').textContent='ตั้งบัญชีสำเร็จ กรุณาเข้าสู่ระบบด้วย User + Password';return}
  out.textContent=data.message||'ไม่สามารถยืนยันตัวตนได้';
 }catch(e){out.textContent='ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่'}finally{btn.disabled=false}
}
document.addEventListener('keydown',e=>{if(e.key==='Enter')memberSearch()});switchMemberType();switchLoginMode();