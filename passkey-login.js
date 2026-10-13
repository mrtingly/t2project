/* Passkey login is disabled unless the server explicitly advertises capability. */
(function(){
'use strict';
function b64(s){s=String(s).replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(s+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))}
function b64url(b){const a=new Uint8Array(b);let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function post(action,extra={}){const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...extra})});return r.json()}
async function ready(){
 if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials)return;
 try{const r=await post('passkeyCapability');if(r.ok&&r.enabled===true)document.getElementById('passkeyLoginBtn').hidden=false}catch(e){}
}
window.t2PasskeyLogin=async function(){
 const out=document.getElementById('memberResult'),btn=document.getElementById('passkeyLoginBtn');
 const username=document.getElementById('memberUsername').value.trim();
 if(!username){out.textContent='กรุณากรอกชื่อผู้ใช้ก่อนกดเข้าสู่ระบบด้วย Passkey';return}
 btn.disabled=true;
 try{
  const begin=await post('passkeyLoginBegin',{username});
  if(!begin.ok)throw Error(begin.message||'ไม่สามารถเริ่ม Passkey ได้');
  const assertion=await navigator.credentials.get({publicKey:{challenge:b64(begin.challenge),rpId:begin.rpId,userVerification:'required',timeout:120000,allowCredentials:begin.credentialIds.map(id=>({type:'public-key',id:b64(id)}))}});
  if(!assertion)throw Error('ไม่ได้รับการยืนยันจากโทรศัพท์');
  const r=assertion.response;
  const done=await post('passkeyLoginFinish',{username,challenge:begin.challenge,credentialId:b64url(assertion.rawId),clientDataJSON:b64url(r.clientDataJSON),authenticatorData:b64url(r.authenticatorData),signature:b64url(r.signature)});
  if(!done.ok||!done.token||!done.member)throw Error(done.message||'เข้าสู่ระบบไม่สำเร็จ');
  sessionStorage.setItem('t2_member',JSON.stringify({citizenId:done.member.citizenId||'',documentId:done.member.citizenId||'',memberId:done.member.memberId,firstName:done.member.firstName,lastName:done.member.lastName,token:done.token}));
  location.href='member.html';
 }catch(e){out.textContent=e.name==='NotAllowedError'?'ยกเลิกการยืนยัน Passkey แล้ว':(e.message||'Passkey ไม่สำเร็จ กรุณาใช้รหัสผ่าน')}
 finally{btn.disabled=false}
};
setTimeout(ready,400);
})();