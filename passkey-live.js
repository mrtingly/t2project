/* T2PROJECT Passkey production client. Password login stays unchanged. */
(()=>{'use strict';
const worker='https://t2project-passkey.mrtingly1.workers.dev';
const gas=()=>window.API_URL||'https://script.google.com/macros/s/AKfycbyp18ODOgdhH2R-QdYBeasG2s4817N7vb3w5fA1wED3J2YiY9QLMODcKRnqH7NoZFWd/exec';
const say=s=>{const el=document.getElementById('memberResult');if(el)el.textContent=s};
async function post(url,payload){const r=await fetch(url,{method:'POST',headers:{'Content-Type':url===worker?'application/json':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});const j=await r.json();if(!j.ok)throw Error(j.message||'ไม่สำเร็จ');return j}
async function library(){return import('https://esm.sh/@simplewebauthn/browser@13.2.2')}
function memberId(){return document.getElementById('memberUsername').value.trim()}
window.t2PasskeyLogin=async()=>{const btn=document.getElementById('passkeyLoginBtn');const userId=memberId();if(!userId){say('กรุณากรอกรหัสสมาชิกก่อน');return}btn.disabled=true;try{const {startAuthentication}=await library();const b=await post(worker,{action:'authBegin',userId});const response=await startAuthentication({optionsJSON:b.options});const verified=await post(worker,{action:'authFinish',userId,response});if(!verified.proof)throw Error('Worker ยังไม่เชื่อมระบบจริง');const result=await post(gas(),{action:'passkeySessionExchange',...verified.proof});if(!result.token||!result.member)throw Error('ไม่พบ Session');sessionStorage.setItem('t2_member',JSON.stringify({citizenId:result.member.citizenId||'',documentId:result.member.citizenId||'',memberId:result.member.memberId,firstName:result.member.firstName,lastName:result.member.lastName,token:result.token}));location.href='member.html'}catch(e){say('Passkey: '+e.message+' (ใช้ Password ได้ตามปกติ)')}finally{btn.disabled=false}};
const button=document.getElementById('passkeyLoginBtn');if(button&&window.PublicKeyCredential)button.hidden=false;
})();