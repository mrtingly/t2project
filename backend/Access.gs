/**
 * T2PROJECT V3 — Server-side access policy, phase 1.
 * This is NOT a finished member login system.
 * Requires a verified server-side identity provider before exposing endpoints.
 * Do not use client-supplied role, room_id, member_id as authority.
 */
const V3_ROLES=Object.freeze({MEMBER:"MEMBER",ADMIN:"ADMIN",OWNER:"OWNER"});
const V3_ACTIONS=Object.freeze({
 VIEW_MEMBER:"VIEW_MEMBER",EDIT_MEMBER:"EDIT_MEMBER",
 VIEW_SLIP_METADATA:"VIEW_SLIP_METADATA",VIEW_ORIGINAL_SLIP:"VIEW_ORIGINAL_SLIP",
 CREATE_SLIP:"CREATE_SLIP",EDIT_SLIP:"EDIT_SLIP",
 VIEW_STATEMENT:"VIEW_STATEMENT",IMPORT_STATEMENT:"IMPORT_STATEMENT",
 PRINT_DATA:"PRINT_DATA",VIEW_HARDSHIP:"VIEW_HARDSHIP"
});
/**
 * Accept only an actor returned from a TRUSTED server-side session verifier.
 * Never construct actor from request parameters.
 */
function v3Authorize_(actor,action,resource) {
 if(!actor || !actor.verified || actor.status!=="ACTIVE") throw new Error("Authentication required");
 const role=actor.role, r=resource||{};
 if(!Object.values(V3_ROLES).includes(role)) throw new Error("Invalid role");
 if(role===V3_ROLES.OWNER) return true;
 if(role===V3_ROLES.ADMIN) {
   if(!actor.room_id || !r.room_id || actor.room_id!==r.room_id) throw new Error("Room access denied");
   if([V3_ACTIONS.VIEW_MEMBER,V3_ACTIONS.EDIT_MEMBER,
       V3_ACTIONS.VIEW_SLIP_METADATA,V3_ACTIONS.CREATE_SLIP,
       V3_ACTIONS.EDIT_SLIP,V3_ACTIONS.VIEW_HARDSHIP].includes(action)) return true;
   throw new Error("Admin action denied");
 }
 if(role===V3_ROLES.MEMBER) {
   if(!actor.member_id || !r.member_id || actor.member_id!==r.member_id) throw new Error("Member access denied");
   if([V3_ACTIONS.VIEW_MEMBER,V3_ACTIONS.VIEW_SLIP_METADATA,
       V3_ACTIONS.VIEW_ORIGINAL_SLIP,V3_ACTIONS.PRINT_DATA].includes(action)) return true;
   throw new Error("Member action denied");
 }
 throw new Error("Access denied");
}
/**
 * Fail-closed entrypoint. Identity integration is deliberately NOT assumed.
 * Calling this before wiring a verified identity provider cannot expose data.
 */
function v3ResolveActor_() {
 throw new Error("Verified authentication provider not configured");
}
/** Use this pattern in EVERY backend handler. */
function v3GuardedAction_(action,resource,handler) {
 const actor=v3ResolveActor_();
 v3Authorize_(actor,action,resource);
 return handler(actor);
}
/**
 * Test only with synthetic identities; never call with real member data.
 * Throws if any policy invariant is broken.
 */
function testV3AccessPolicy() {
 const owner={verified:true,status:"ACTIVE",role:"OWNER"};
 const admin={verified:true,status:"ACTIVE",role:"ADMIN",room_id:"R001"};
 const member={verified:true,status:"ACTIVE",role:"MEMBER",member_id:"TEST001"};
 const allow=(a,x,r)=>{if(v3Authorize_(a,x,r)!==true)throw new Error("Expected allow");};
 const deny=(a,x,r)=>{
   let rejected=false;
   try{v3Authorize_(a,x,r);}catch(e){rejected=true;}
   if(!rejected)throw new Error("Expected deny: "+x);
 };
 allow(owner,V3_ACTIONS.IMPORT_STATEMENT,{});
 allow(admin,V3_ACTIONS.CREATE_SLIP,{room_id:"R001"});
 deny(admin,V3_ACTIONS.CREATE_SLIP,{room_id:"R002"});
 deny(admin,V3_ACTIONS.VIEW_ORIGINAL_SLIP,{room_id:"R001"});
 deny(admin,V3_ACTIONS.PRINT_DATA,{room_id:"R001"});
 allow(member,V3_ACTIONS.VIEW_ORIGINAL_SLIP,{member_id:"TEST001"});
 deny(member,V3_ACTIONS.VIEW_ORIGINAL_SLIP,{member_id:"TEST002"});
 deny(member,V3_ACTIONS.CREATE_SLIP,{member_id:"TEST001"});
 deny({verified:false,status:"ACTIVE",role:"OWNER"},V3_ACTIONS.VIEW_MEMBER,{});
 return "PASS: synthetic authorization policy tests";
}
