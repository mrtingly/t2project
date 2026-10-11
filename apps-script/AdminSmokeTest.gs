/** Manual smoke tests that do not access member data or modify sheets. */
function t2AdminSmokeTest(){
 const refs=["123456","000001","12345","1234567","ABC123",""];
 const expected=[true,true,false,false,false,false];
 const actual=refs.map(s=>/^[0-9]{6}$/.test(s));
 return {ok:actual.every((v,i)=>v===expected[i]),cases:refs.map((value,i)=>({value:value,pass:actual[i]===expected[i]}))};
}
