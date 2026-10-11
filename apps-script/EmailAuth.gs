/** T2PROJECT: email OTP authentication has been retired by owner decision.
 * No OTP generation, sending, confirmation, or session issuance is permitted.
 * Account requests must be approved by an authorized administrator through
 * a separately reviewed identity-verification workflow.
 */
function t2EmailAuthRequest_(){return {ok:false,error:"OTP_DISABLED"};}
function t2EmailAuthConfirm_(){return {ok:false,error:"OTP_DISABLED"};}
function t2EmailAuthPolicyTest(){return {ok:true,mode:"otp-disabled"};}
