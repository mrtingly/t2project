/**
 * T2PROJECT V3: reusable validation for receipt allocations.
 * Pure functions: no real data, no spreadsheet writes.
 * Amounts are represented as integer satang to avoid floating point drift.
 */
function v3Satang_(value) {
  const s=String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(s)) throw new Error("Invalid money amount");
  const [baht,dec=""]=s.split(".");
  const n=Number(baht)*100+Number(dec.padEnd(2,"0"));
  if (!Number.isSafeInteger(n)) throw new Error("Amount too large");
  return n;
}
function v3ValidateAllocations_(receiptAmount,allocations) {
  const receipt=v3Satang_(receiptAmount);
  if(receipt<=0) throw new Error("Receipt must be positive");
  if(!Array.isArray(allocations)||!allocations.length) throw new Error("Allocations required");
  const seen=new Set();let total=0;
  for(const item of allocations) {
    if(!item||!String(item.member_id||"").trim()) throw new Error("Member required");
    const key=String(item.member_id).trim();
    if(seen.has(key)) throw new Error("Duplicate beneficiary in allocation");
    seen.add(key);
    const n=v3Satang_(item.amount);
    if(n<=0) throw new Error("Allocation must be positive");
    total+=n;
    if(!Number.isSafeInteger(total)||total>receipt) throw new Error("Allocations exceed receipt amount");
  }
  return {receipt_satang:receipt,allocated_satang:total,unallocated_satang:receipt-total};
}
function testV3AllocationValidation() {
  const ok=v3ValidateAllocations_("100.00",[{member_id:"M1",amount:"30.25"},{member_id:"M2",amount:"69.75"}]);
  if(ok.unallocated_satang!==0) throw new Error("Expected balanced allocation");
  const rejected=(amount,items)=>{let threw=false;try{v3ValidateAllocations_(amount,items)}catch(_){threw=true}if(!threw)throw new Error("Expected rejection")};
  rejected("100.00",[{member_id:"M1",amount:"100.01"}]);
  rejected("100.00",[{member_id:"M1",amount:"50.00"},{member_id:"M1",amount:"20.00"}]);
  rejected("100.00",[{member_id:"M1",amount:"-1.00"}]);
  rejected("0",[{member_id:"M1",amount:"1"}]);
  return "PASS: allocation validation tests";
}
