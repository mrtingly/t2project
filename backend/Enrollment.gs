/**
 * T2PROJECT V3 — Admin-first member registration and name/ID lookup.
 * Thai prefixes/titles are NEVER stored in first_name or last_name.
 *
 * Important: Name + national ID are identifiers, NOT sufficient proof of identity.
 * Do not expose profiles, receipts, financial records or identity photos until
 * an independent verification step succeeds.
 *
 * Requires: Schema.gs, Access.gs, and a server-side identity verification flow.
 * Not wired to public HTTP endpoints.
 */
function v3NormalizeName_(value) {
 const s=String(value||"").normalize("NFC").trim().replace(/\s+/g," ");
 if(!s)throw new Error("First and last name are required");
 if(/^(นาย|นางสาว|นาง|น\.ส\.|ดร\.|เด็กชาย|เด็กหญิง|นางสาว)\s*/i.test(s))
   throw new Error("Do not enter a title or prefix");
 return s;
}
function v3ValidateNationalId_(value){
 const id=String(value||"").replace(/\s|-/g,"");
 if(!/^\d{13}$/.test(id))throw new Error("National ID must contain 13 digits");
 const sum=id.slice(0,12).split("").reduce((a,c,i)=>a+Number(c)*(13-i),0);
 if((11-(sum%11))%10!==Number(id[12]))throw new Error("Invalid national ID checksum");
 return id;
}
/**
 * The client never supplies actor roles directly. Actor must come from a
 * verified server session. Store ID encrypted via a vetted external key
 * management design, and a keyed lookup token; never plaintext.
 */
function v3RegisterMemberDraft_(actor,input) {
 if(!actor || !actor.verified || actor.role!=="ADMIN" || actor.status!=="ACTIVE")
   throw new Error("Authenticated Admin required");
 if(!input || input.room_id!==actor.room_id)throw new Error("Room access denied");
 const first=v3NormalizeName_(input.first_name);
 const last=v3NormalizeName_(input.last_name);
 const id=v3ValidateNationalId_(input.national_id);
 // Intentionally fail closed until encrypted identity storage, duplicate
 // checking across rooms, audit, and secure member lookup are implemented.
 throw new Error("Secure identity storage and duplicate checks not configured");
}
/**
 * Lookup specification: exact normalized first_name + last_name + 13-digit ID,
 * from an Admin-created member record. The lookup must not reveal whether
 * the ID exists to unauthenticated users; use rate limiting and anti-enumeration.
 * The matched member's sensitive profile must require independent verification.
 */
function v3MemberProfileEntry_(firstName,lastName,nationalId){
 v3NormalizeName_(firstName);
 v3NormalizeName_(lastName);
 v3ValidateNationalId_(nationalId);
 throw new Error("Independent identity verification not configured");
}
