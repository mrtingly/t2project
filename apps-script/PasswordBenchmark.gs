/**
 * Manual, bounded KDF benchmark for the actual Apps Script runtime.
 * Uses a fixed synthetic password; never accesses Sheets or real credentials.
 * Run t2PasswordBenchmark() from the editor, not from a public API route.
 */
function t2PasswordBenchmark(){
 const password="SyntheticBenchmark9Password";
 const salt="12345678-1234-1234-1234-123456789abc12345678-1234-1234-1234-123456789abc";
 const samples=[1000,3000,12000];
 const results=[];
 for(const iterations of samples){
  const start=Date.now();
  const derived=t2Pbkdf2_(password,salt,iterations);
  const elapsed=Date.now()-start;
  if(typeof derived!=="string"||!derived.length)throw Error("KDF benchmark failed");
  results.push({iterations,elapsed_ms:elapsed});
 }
 const report={ok:true,results,production_iterations:T2_PASSWORD_ITERATIONS_,
  note:"Manual synthetic timing only; not a production load test"};
 console.log(JSON.stringify(report));
 return report;
}
