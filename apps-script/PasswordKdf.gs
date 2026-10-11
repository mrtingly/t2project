/**
 * PBKDF2-HMAC-SHA256, RFC 8018 (one 256-bit block).
 * Iteration count is stored with each credential for future upgrades.
 * Benchmark in Apps Script before enabling public authentication.
 */
const T2_PASSWORD_ITERATIONS_=12000;
function t2BytesXor_(target,source){
 for(let i=0;i<target.length;i++)target[i]=(target[i]^source[i])&255;
}
function t2Pbkdf2_(password,salt,iterations){
 if(typeof password!=="string"||typeof salt!=="string"||
    !Number.isInteger(iterations)||iterations<1000||iterations>1000000)
  throw Error("Invalid KDF parameters");
 const key=Utilities.newBlob(password).getBytes();
 const block=Utilities.newBlob(salt).getBytes().concat([0,0,0,1]);
 let u=Utilities.computeHmacSha256Signature(block,key).map(v=>v&255);
 const out=u.slice();
 for(let i=1;i<iterations;i++){
  u=Utilities.computeHmacSha256Signature(u,key).map(v=>v&255);
  t2BytesXor_(out,u);
 }
 return Utilities.base64EncodeWebSafe(out);
}
function t2PasswordCreate_(password){
 const salt=Utilities.getUuid()+Utilities.getUuid();
 return {salt:"pbkdf2-sha256:"+T2_PASSWORD_ITERATIONS_+":"+salt,
  password_hash:t2Pbkdf2_(password,salt,T2_PASSWORD_ITERATIONS_)};
}
function t2PasswordVerify_(password,storedSalt,storedHash){
 if(typeof password!=="string"||typeof storedSalt!=="string"||
    typeof storedHash!=="string")return false;
 const match=/^pbkdf2-sha256:(\d+):([0-9a-f-]{72})$/.exec(storedSalt);
 if(!match)return false; // Reject legacy unsalted or iterated SHA-256 credentials.
 const iterations=Number(match[1]);
 if(iterations<1000||iterations>1000000)return false;
 const candidate=t2Pbkdf2_(password,match[2],iterations);
 if(candidate.length!==storedHash.length)return false;
 let diff=0;
 for(let i=0;i<candidate.length;i++)diff|=candidate.charCodeAt(i)^storedHash.charCodeAt(i);
 return diff===0;
}
function t2PasswordKdfTest(){
 // RFC 6070 style round-trip plus tamper and legacy-format rejection.
 const salt="12345678-1234-1234-1234-123456789abc12345678-1234-1234-1234-123456789abc";
 const record="pbkdf2-sha256:1000:"+salt;
 const hash=t2Pbkdf2_("CorrectHorse9Battery",salt,1000);
 const ok=t2PasswordVerify_("CorrectHorse9Battery",record,hash)&&
  !t2PasswordVerify_("WrongHorse9Battery",record,hash)&&
  !t2PasswordVerify_("CorrectHorse9Battery","legacy",hash);
 if(!ok)throw Error("PBKDF2 regression failed");
 return {ok:true,algorithm:"PBKDF2-HMAC-SHA256",iterations:1000};
}
