import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse} from '@simplewebauthn/server';
const reply=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'https://mrtingly.github.io','vary':'Origin'}});
const time=()=>Math.floor(Date.now()/1000);
const userOk=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{3,64}$/.test(s);
const decode=s=>{const t=s.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(t+'='.repeat((4-t.length%4)%4)))};
export default {async fetch(req,env){
 const origin=req.headers.get('Origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'https://mrtingly.github.io','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'600','vary':'Origin'}});
 if(req.method==='GET')return reply({ok:true,mode:'isolated-passkey-test',productionLogin:false});
 if(req.method!=='POST')return reply({ok:false},405);
 if(origin!=='https://mrtingly.github.io')return reply({ok:false,message:'Origin not allowed'},403);
 if(!env.DB||!env.RP_ID||!env.EXPECTED_ORIGIN||!env.TEST_ENROLL_SECRET)return reply({ok:false,message:'Missing configuration'},503);
 if(env.RP_ID!=='mrtingly.github.io'||env.EXPECTED_ORIGIN!=='https://mrtingly.github.io')return reply({ok:false,message:'RP configuration mismatch'},503);
 let d;try{d=await req.json()}catch{return reply({ok:false,message:'Invalid JSON'},400)}
 const {action,userId}=d;if(!userOk(userId))return reply({ok:false,message:'Invalid test user'},400);
 const authorized=d.testSecret===env.TEST_ENROLL_SECRET;
 try{
 if(action==='registerBegin'){
 if(!authorized)return reply({ok:false},403);
 const old=await env.DB.prepare('SELECT credential_id FROM passkey_credentials WHERE member_id=?').bind(userId).all();
 const options=await generateRegistrationOptions({rpName:'T2PROJECT Passkey Test',rpID:env.RP_ID,userName:userId,userID:new TextEncoder().encode(userId),attestationType:'none',authenticatorSelection:{userVerification:'required',residentKey:'preferred'},excludeCredentials:old.results.map(r=>({id:r.credential_id}))});
 await env.DB.prepare('INSERT INTO passkey_challenges(challenge_id,member_id,challenge,purpose,expires_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),userId,options.challenge,'register',time()+300).run();
 return reply({ok:true,options});
 }
 if(action==='registerFinish'){
 if(!authorized)return reply({ok:false},403);
 const challenge=decode(d.response.response.clientDataJSON).challenge;
 const row=await env.DB.prepare('DELETE FROM passkey_challenges WHERE member_id=? AND challenge=? AND purpose=? AND expires_at>? RETURNING challenge').bind(userId,challenge,'register',time()).first();
 if(!row)return reply({ok:false,message:'Challenge expired or used'},403);
 const v=await verifyRegistrationResponse({response:d.response,expectedChallenge:challenge,expectedOrigin:env.EXPECTED_ORIGIN,expectedRPID:env.RP_ID,requireUserVerification:true});
 if(!v.verified||!v.registrationInfo)return reply({ok:false},403);
 const c=v.registrationInfo.credential;
 await env.DB.prepare('INSERT INTO passkey_credentials(credential_id,member_id,public_key,counter,transports,device_type,backed_up) VALUES(?,?,?,?,?,?,?)').bind(c.id,userId,JSON.stringify([...c.publicKey]),c.counter,JSON.stringify(d.response.response.transports||[]),v.registrationInfo.credentialDeviceType||null,v.registrationInfo.credentialBackedUp?1:0).run();
 return reply({ok:true,registered:true});
 }
 if(action==='authBegin'){
 const rows=await env.DB.prepare('SELECT credential_id FROM passkey_credentials WHERE member_id=?').bind(userId).all();
 if(!rows.results.length)return reply({ok:false,message:'No credential'},404);
 const options=await generateAuthenticationOptions({rpID:env.RP_ID,userVerification:'required',allowCredentials:rows.results.map(r=>({id:r.credential_id}))});
 await env.DB.prepare('INSERT INTO passkey_challenges(challenge_id,member_id,challenge,purpose,expires_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),userId,options.challenge,'authenticate',time()+300).run();
 return reply({ok:true,options});
 }
 if(action==='authFinish'){
 const c=await env.DB.prepare('SELECT * FROM passkey_credentials WHERE member_id=? AND credential_id=?').bind(userId,d.response?.id).first();
 if(!c)return reply({ok:false},403);
 const challenge=decode(d.response.response.clientDataJSON).challenge;
 const row=await env.DB.prepare('DELETE FROM passkey_challenges WHERE member_id=? AND challenge=? AND purpose=? AND expires_at>? RETURNING challenge').bind(userId,challenge,'authenticate',time()).first();
 if(!row)return reply({ok:false,message:'Challenge expired or used'},403);
 const v=await verifyAuthenticationResponse({response:d.response,expectedChallenge:challenge,expectedOrigin:env.EXPECTED_ORIGIN,expectedRPID:env.RP_ID,requireUserVerification:true,credential:{id:c.credential_id,publicKey:new Uint8Array(JSON.parse(c.public_key)),counter:c.counter,transports:JSON.parse(c.transports||'[]')}});
 if(!v.verified)return reply({ok:false},403);
 await env.DB.prepare('UPDATE passkey_credentials SET counter=?,last_used_at=? WHERE credential_id=?').bind(v.authenticationInfo.newCounter,time(),c.credential_id).run();
 return reply({ok:true,passkeyVerified:true,productionLogin:false});
 }
 return reply({ok:false,message:'Unknown action'},404);
 }catch(e){return reply({ok:false,message:'Passkey operation failed'},400)}
}};
