/* T2PROJECT Passkey WebAuthn client. Requires backend V5+Passkey deployment. */
(function(){
'use strict';
const enc=new TextEncoder();
function decode(s){const x=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(x+'='.repeat((4-x.length%4)%4)),c=>c.charCodeAt(0))}
function encode(b){const a=new Uint8Array(b);let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function ready(){return !!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext)}
async function begin(mode,extra={}){const d=await api('passkeyBegin',{mode,...extra});if(!d.ok)throw Error(d.message||'เริ่ม Passkey ไม่สำเร็จ');return d}
async function openEdit(){const d=await api('getMemberProfile',{profileGrant});if(!d.ok)throw Error(d.message||'เปิดโปรไฟล์ไม่ได้');if(d.found&&d.data){profile={...profile,...d.data.profile};contacts=d.data.contacts||[];beneficiaries=d.data.beneficiaries||[]}fillEdit();renderContacts();renderBeneficiaries();profileView.classList.add('hidden');profileEdit.classList.remove('hidden')}
window.t2PasskeyRegister=async function(){
 if(!ready()){alert('อุปกรณ์ไม่รองรับ Passkey');return}
 try{
 if(!profileGrant||Date.now()>profileGrantUntil){alert('กรุณากด แก้ไข และยืนยันรหัสผ่านก่อนลงทะเบียน Passkey');return}
 const d=await begin('register',{profileGrant});
 const userId=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(String(memberKey))));
 const cred=await navigator.credentials.create({publicKey:{challenge:decode(d.challenge),rp:{id:d.rpId,name:'T2PROJECT'},user:{id:userId,name:'T2 Member',displayName:'T2PROJECT Member'},pubKeyCredParams:[{type:'public-key',alg:-7}],timeout:120000,attestation:'none',authenticatorSelection:{userVerification:'required',residentKey:'preferred'},excludeCredentials:d.credentialIds.map(id=>({type:'public-key',id:decode(id)}))}});
 if(!cred)throw Error('ไม่ได้รับ Passkey');
 const out=await api('passkeyRegister',{profileGrant,challenge:d.challenge,credentialId:encode(cred.rawId),clientDataJSON:encode(cred.response.clientDataJSON),attestationObject:encode(cred.response.attestationObject)});
 if(!out.ok)throw Error(out.message||'บันทึก Passkey ไม่สำเร็จ');alert('ลงทะเบียน Passkey สำเร็จ');
 }catch(e){alert('ลงทะเบียน Passkey: '+(e.message||e))}
};
window.t2PasskeyUnlock=async function(){
 if(!ready()){alert('อุปกรณ์ไม่รองรับ Passkey');return}
 try{
 const d=await begin('authenticate');
 const assertion=await navigator.credentials.get({publicKey:{challenge:decode(d.challenge),rpId:d.rpId,userVerification:'required',timeout:120000,allowCredentials:d.credentialIds.map(id=>({type:'public-key',id:decode(id)}))}});
 if(!assertion)throw Error('ไม่ได้รับการยืนยัน');
 const res=assertion.response;
 const out=await api('passkeyAuthenticate',{challenge:d.challenge,credentialId:encode(assertion.rawId),clientDataJSON:encode(res.clientDataJSON),authenticatorData:encode(res.authenticatorData),signature:encode(res.signature)});
 if(!out.ok)throw Error(out.message||'ยืนยันไม่สำเร็จ');
 profileGrant=out.profileGrant;profileGrantUntil=Date.now()+Math.min(600,out.expiresIn||600)*1000;centralProfileReady=true;await openEdit();
 }catch(e){alert('ยืนยัน Passkey: '+(e.message||e))}
};
async function showButtons(){
 const el=document.getElementById('t2PasskeyButtons');if(!el)return;
 try{const s=await api('passkeyStatus');if(s.ok&&s.enabled&&ready())el.hidden=false;}catch(e){}
}
setTimeout(showButtons,700);
})();